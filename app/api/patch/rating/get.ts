import { z } from 'zod'
import { prisma } from '~/prisma/index'
import type { KunPatchRating } from '~/types/api/galgame'

export const getPatchRatingSchema = z.object({
  patchId: z.coerce.number().min(1).max(9999999),
  page: z.coerce.number().min(1).max(9999999),
  limit: z.coerce.number().min(1).max(50)
})

export const getPatchRating = async (
  input: z.infer<typeof getPatchRatingSchema>,
  uid: number
) => {
  const { patchId, page, limit } = input

  const [data, total] = await Promise.all([
    prisma.patch_rating.findMany({
      where: { patch_id: patchId },
      orderBy: { created: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        patch: { select: { unique_id: true } },
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        },
        _count: {
          select: { like: true }
        },
        like: {
          where: {
            user_id: uid
          }
        }
      }
    }),
    prisma.patch_rating.count({
      where: { patch_id: patchId }
    })
  ])

  const ratings: KunPatchRating[] = data.map((rating) => ({
    id: rating.id,
    uniqueId: rating.patch.unique_id,
    recommend: rating.recommend,
    overall: rating.overall,
    playStatus: rating.play_status,
    shortSummary: rating.short_summary,
    spoilerLevel: rating.spoiler_level,
    isLike: rating.like.length > 0,
    likeCount: rating._count.like,
    userId: rating.user_id,
    patchId: rating.patch_id,
    created: rating.created,
    updated: rating.updated,
    user: {
      id: rating.user.id,
      name: rating.user.name,
      avatar: rating.user.avatar
    }
  }))

  return { ratings, total }
}
