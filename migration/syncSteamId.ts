import 'dotenv/config'
import { prisma } from '~/prisma/index'

const STEAM_APP_REGEX = /store\.steampowered\.com\/app\/(\d+)/

async function syncSteamId() {
  const patches = await prisma.patch.findMany({
    where: {
      steam_id: null,
      introduction: { contains: 'store.steampowered.com/app/' }
    },
    select: {
      id: true,
      unique_id: true,
      introduction: true
    },
    orderBy: { id: 'asc' }
  })

  console.log(
    `找到 ${patches.length} 个含有 Steam 链接且没有 steam_id 的 patch`
  )

  const existingSteamIds = new Set(
    (
      await prisma.patch.findMany({
        where: { steam_id: { not: null } },
        select: { steam_id: true }
      })
    ).map((p) => p.steam_id!)
  )

  let successCount = 0
  let skipCount = 0
  let noMatchCount = 0

  for (const patch of patches) {
    const supportIdx = patch.introduction.indexOf('## 支持正版')
    if (supportIdx === -1) {
      noMatchCount++
      continue
    }

    const afterSupport = patch.introduction.slice(supportIdx)
    const match = afterSupport.match(STEAM_APP_REGEX)

    if (!match) {
      noMatchCount++
      continue
    }

    const steamId = Number(match[1])

    if (existingSteamIds.has(steamId)) {
      skipCount++
      console.log(
        `${patch.unique_id}: steam_id=${steamId} 已被其他 patch 占用，跳过`
      )
      continue
    }

    await prisma.patch.update({
      where: { id: patch.id },
      data: { steam_id: steamId }
    })

    existingSteamIds.add(steamId)
    successCount++
  }

  console.log(`\n同步完成:`)
  console.log(`  成功: ${successCount}`)
  console.log(`  ID 冲突跳过: ${skipCount}`)
  console.log(`  无匹配: ${noMatchCount}`)
  console.log(`  总计: ${patches.length}`)
}

syncSteamId()
  .catch((error) => {
    console.error('Migration failed:', error)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
