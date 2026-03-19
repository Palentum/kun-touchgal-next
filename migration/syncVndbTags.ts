import 'dotenv/config'
import { prisma } from '~/prisma/index'
import { ensurePatchTagsFromVNDB } from '~/app/api/edit/fetchTags'

const BATCH_SIZE = 50
const DELAY_MS = 2000
const SYSTEM_USER_ID = 1

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function syncVndbTags() {
  const patches = await prisma.patch.findMany({
    where: {
      vndb_id: { not: null }
    },
    select: {
      id: true,
      vndb_id: true,
      unique_id: true
    },
    orderBy: { id: 'asc' }
  })

  console.log(`Found ${patches.length} patches with VNDB ID`)

  let successCount = 0
  let failCount = 0
  let skipCount = 0

  for (let i = 0; i < patches.length; i++) {
    const patch = patches[i]

    try {
      const result = await ensurePatchTagsFromVNDB(
        patch.id,
        patch.vndb_id,
        SYSTEM_USER_ID
      )

      if (result.related > 0) {
        successCount++
        console.log(
          `[${i + 1}/${patches.length}] ${patch.unique_id} (${patch.vndb_id}): ` +
            `新建=${result.ensured}, 关联=${result.related}`
        )
      } else {
        skipCount++
        console.log(
          `[${i + 1}/${patches.length}] ${patch.unique_id} (${patch.vndb_id}): 无匹配标签`
        )
      }
    } catch (error) {
      failCount++
      console.error(
        `[${i + 1}/${patches.length}] ${patch.unique_id} (${patch.vndb_id}): 失败`,
        error
      )
    }

    if ((i + 1) % BATCH_SIZE === 0) {
      console.log(
        `--- 进度: ${i + 1}/${patches.length}, 等待 ${DELAY_MS}ms 避免触发 API 限速 ---`
      )
      await sleep(DELAY_MS)
    }
  }

  console.log(`\n同步完成:`)
  console.log(`  成功: ${successCount}`)
  console.log(`  无标签: ${skipCount}`)
  console.log(`  失败: ${failCount}`)
  console.log(`  总计: ${patches.length}`)
}

syncVndbTags()
  .catch((error) => {
    console.error('Migration failed:', error)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
