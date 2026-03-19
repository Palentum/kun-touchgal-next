import 'dotenv/config'
import { prisma } from '~/prisma/index'

async function setTagSourceBangumi() {
  const result = await prisma.patch_tag.updateMany({
    where: { source: 'self' },
    data: { source: 'bangumi' }
  })

  console.log(`Updated ${result.count} tags source to 'bangumi'`)
}

setTagSourceBangumi()
  .catch((error) => {
    console.error('Migration failed:', error)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
