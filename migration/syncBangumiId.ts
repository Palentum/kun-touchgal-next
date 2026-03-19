import 'dotenv/config'
import { prisma } from '~/prisma/index'
import { BANGUMI_API_BASE, BANGUMI_HEADERS } from '~/constants/bangumi'

const REQUEST_DELAY = 500
const SUBJECT_TYPE_GAME = 4

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

interface BangumiSubject {
  id: number
  name: string
  name_cn: string
}

interface BangumiSearchResponse {
  data: BangumiSubject[]
  total: number
}

async function searchBangumi(
  keyword: string
): Promise<BangumiSubject[]> {
  const response = await fetch(
    `${BANGUMI_API_BASE}/v0/search/subjects?limit=10`,
    {
      method: 'POST',
      headers: BANGUMI_HEADERS,
      body: JSON.stringify({
        keyword,
        filter: { type: [SUBJECT_TYPE_GAME], nsfw: true },
        sort: 'match'
      })
    }
  )

  if (!response.ok) {
    if (response.status === 429) {
      console.log('  触发限速，等待 5 秒...')
      await sleep(5000)
      return searchBangumi(keyword)
    }
    return []
  }

  const data = (await response.json()) as BangumiSearchResponse
  return data.data || []
}

function findExactMatch(
  results: BangumiSubject[],
  names: string[]
): BangumiSubject | null {
  const nameSet = new Set(names.filter(Boolean))

  for (const result of results) {
    if (nameSet.has(result.name) || nameSet.has(result.name_cn)) {
      return result
    }
  }

  return null
}

async function syncBangumiId() {
  console.log('Step 1: 获取需要同步的 patch...')

  const patches = await prisma.patch.findMany({
    where: { bangumi_id: null },
    select: {
      id: true,
      name: true,
      unique_id: true,
      alias: { select: { name: true } }
    },
    orderBy: { id: 'asc' }
  })

  console.log(`找到 ${patches.length} 个没有 bangumi_id 的 patch`)

  const existingBangumiIds = new Set(
    (
      await prisma.patch.findMany({
        where: { bangumi_id: { not: null } },
        select: { bangumi_id: true }
      })
    ).map((p) => p.bangumi_id!)
  )

  console.log(`已有 ${existingBangumiIds.size} 个 bangumi_id 被占用`)

  let matchCount = 0
  let noMatchCount = 0
  let skipCount = 0
  let failCount = 0

  console.log('\nStep 2: 逐个搜索并匹配...')

  for (let i = 0; i < patches.length; i++) {
    const patch = patches[i]
    const allNames = [patch.name, ...patch.alias.map((a) => a.name)]

    try {
      const results = await searchBangumi(patch.name)
      let match = findExactMatch(results, allNames)

      if (!match && patch.alias.length > 0) {
        for (const alias of patch.alias) {
          if (match) break
          await sleep(REQUEST_DELAY)
          const aliasResults = await searchBangumi(alias.name)
          match = findExactMatch(aliasResults, allNames)
        }
      }

      if (!match) {
        noMatchCount++
        if ((i + 1) % 100 === 0) {
          console.log(`[${i + 1}/${patches.length}] 进度更新...`)
        }
        await sleep(REQUEST_DELAY)
        continue
      }

      if (existingBangumiIds.has(match.id)) {
        skipCount++
        console.log(
          `[${i + 1}/${patches.length}] ${patch.unique_id} "${patch.name}": ` +
            `bangumi_id=${match.id} 已被其他 patch 占用，跳过`
        )
        await sleep(REQUEST_DELAY)
        continue
      }

      await prisma.patch.update({
        where: { id: patch.id },
        data: { bangumi_id: match.id }
      })

      existingBangumiIds.add(match.id)
      matchCount++
      console.log(
        `[${i + 1}/${patches.length}] ${patch.unique_id} "${patch.name}" => ` +
          `bangumi_id=${match.id} (${match.name} / ${match.name_cn})`
      )
    } catch (error) {
      failCount++
      console.error(
        `[${i + 1}/${patches.length}] ${patch.unique_id} "${patch.name}": 失败`,
        error
      )
    }

    await sleep(REQUEST_DELAY)
  }

  console.log(`\n同步完成:`)
  console.log(`  匹配成功: ${matchCount}`)
  console.log(`  无匹配: ${noMatchCount}`)
  console.log(`  ID 冲突跳过: ${skipCount}`)
  console.log(`  失败: ${failCount}`)
  console.log(`  总计: ${patches.length}`)
}

syncBangumiId()
  .catch((error) => {
    console.error('Migration failed:', error)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
