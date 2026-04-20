import { prisma } from '~/prisma/index'
import { incrementPatchViewBuffer } from './buffer'

const logPatchViewError = (message: string, error: unknown) => {
  // eslint-disable-next-line no-console
  console.error(message, error)
}

export const updatePatchViews = async (uniqueId: string) => {
  try {
    await incrementPatchViewBuffer(uniqueId)
    return
  } catch (error) {
    logPatchViewError('Failed to buffer patch view increment:', error)
  }

  try {
    await prisma.patch.updateMany({
      where: { unique_id: uniqueId },
      data: { view: { increment: 1 } }
    })
  } catch (error) {
    logPatchViewError('Failed to update patch views in DB:', error)
  }
}
