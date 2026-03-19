import 'dotenv/config'
import { prisma } from '~/prisma/index'

const TARGET_RESOURCE_NAMES = [
  '电脑版游戏本体下载资源',
  '手机版游戏本体下载资源'
] as const

const TARGET_NOTE = '无解压密码'

async function clearResourceNameAndNote() {
  const where = {
    name: {
      in: [...TARGET_RESOURCE_NAMES]
    },
    note: TARGET_NOTE
  }

  const summary = await prisma.patch_resource.groupBy({
    by: ['name'],
    where,
    _count: {
      _all: true
    }
  })

  const total = summary.reduce((count, item) => count + item._count._all, 0)

  if (!total) {
    console.log('No matching resources found')
    return
  }

  const summaryMap = Object.fromEntries(
    summary.map((item) => [item.name, item._count._all])
  )

  console.log(`Found ${total} matching resources`)
  console.log(summaryMap)

  const result = await prisma.patch_resource.updateMany({
    where,
    data: {
      name: '',
      note: ''
    }
  })

  console.log(`Cleared ${result.count} resources`)
}

clearResourceNameAndNote()
  .catch((error) => {
    console.error('Migration failed:', error)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
