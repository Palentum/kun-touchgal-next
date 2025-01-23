import { z } from 'zod'
import { prisma } from '~/prisma/index'
import { patchUpdateSchema } from '~/validations/edit'
import { handleBatchPatchTags } from './batchTag'

export const updateGalgame = async (
  input: z.infer<typeof patchUpdateSchema>,
  uid: number
) => {
  const patch = await prisma.patch.findUnique({ where: { id: input.id } })
  if (!patch) {
    return '该 ID 下未找到对应 Galgame'
  }

  const { id, name, alias, introduction, contentLimit } = input

  await prisma.patch.update({
    where: { id },
    data: {
      name,
      alias: alias ? alias : [],
      introduction,
      content_limit: contentLimit
    }
  })

  const res = await handleBatchPatchTags(input.id, input.tag, uid)
  return res
}
