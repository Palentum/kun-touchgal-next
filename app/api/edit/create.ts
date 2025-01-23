import crypto from 'crypto'
import { z } from 'zod'
import { prisma } from '~/prisma/index'
import { uploadPatchBanner } from './_upload'
import { patchCreateSchema } from '~/validations/edit'
import { handleBatchPatchTags } from './batchTag'

export const createGalgame = async (
  input: Omit<z.infer<typeof patchCreateSchema>, 'alias' | 'tag'> & {
    alias: string[]
    tag: string[]
  },
  uid: number
) => {
  const {
    name,
    vndbId,
    alias,
    banner,
    tag,
    introduction,
    released,
    contentLimit
  } = input

  const bannerArrayBuffer = banner as ArrayBuffer
  const galgameUniqueId = crypto.randomBytes(4).toString('hex')

  const res = await prisma.$transaction(
    async (prisma) => {
      const patch = await prisma.patch.create({
        data: {
          name,
          unique_id: galgameUniqueId,
          vndb_id: vndbId ?? '',
          alias: alias ? alias : [],
          introduction,
          user_id: uid,
          banner: '',
          released,
          content_limit: contentLimit
        }
      })

      const newId = patch.id

      const res = await uploadPatchBanner(bannerArrayBuffer, newId)
      if (typeof res === 'string') {
        return res
      }
      const imageLink = `${process.env.KUN_VISUAL_NOVEL_IMAGE_BED_URL}/patch/${newId}/banner/banner.avif`

      await prisma.patch.update({
        where: { id: newId },
        data: { banner: imageLink }
      })

      await prisma.user.update({
        where: { id: uid },
        data: {
          daily_image_count: { increment: 1 },
          moemoepoint: { increment: 3 }
        }
      })

      return { patchId: patch.id }
    },
    { timeout: 60000 }
  )

  if (typeof res === 'string') {
    return res
  }

  await handleBatchPatchTags(res.patchId, tag, uid)

  return { uniqueId: galgameUniqueId }
}
