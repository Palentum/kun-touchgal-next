import { z } from 'zod'
import { prisma } from '~/prisma/index'
import { patchUpdateSchema } from '~/validations/edit'

export const updateGalgame = async (
  input: z.infer<typeof patchUpdateSchema>
) => {
  const { id, name, alias, introduction, contentLimit } = input

  const patch = await prisma.patch.findUnique({ where: { id } })
  if (!patch) {
    return '该 ID 下未找到对应 Galgame'
  }

  await prisma.patch.update({
    where: { id },
    data: {
      name,
      alias: alias ? alias : [],
      introduction,
      content_limit: contentLimit
    }
  })

  return {}
}
