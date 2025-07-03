import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const updatePatchResourceUpdateTime = async () => {
  try {
    await prisma.user_message.updateMany({
      where: { type: { in: ['comment', 'mention'] } },
      data: { link: '' }
    })

    console.log('Successfully updated all message links.')
  } catch (error) {
    console.error('Error updating message links:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updatePatchResourceUpdateTime()
