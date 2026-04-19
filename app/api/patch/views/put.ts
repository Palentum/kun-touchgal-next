import { incrementPatchViewBuffer } from './buffer'

export const updatePatchViews = async (uniqueId: string) => {
  await incrementPatchViewBuffer(uniqueId)
}
