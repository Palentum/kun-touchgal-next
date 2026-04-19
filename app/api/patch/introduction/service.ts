import { z } from 'zod'
import {
  buildPatchIntroduction,
  getCachedPatchIntroduction,
  setCachedPatchIntroduction
} from '../_content'
import { getPatchIntroductionContentByUniqueId } from '../_queries'

const uniqueIdSchema = z.object({
  uniqueId: z.string().min(8).max(8)
})

export const getPatchIntroduction = async (
  input: z.infer<typeof uniqueIdSchema>
) => {
  const cachedIntro = await getCachedPatchIntroduction(input.uniqueId)
  if (cachedIntro) {
    return cachedIntro
  }

  const { uniqueId } = input

  const patch = await getPatchIntroductionContentByUniqueId(uniqueId)
  if (!patch) {
    return '未找到对应 Galgame'
  }

  const response = await buildPatchIntroduction(patch)
  await setCachedPatchIntroduction(input.uniqueId, response)

  return response
}
