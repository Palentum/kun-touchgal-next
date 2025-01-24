'use server'

import { z } from 'zod'
import { prisma } from '~/prisma/index'
import { getUserInfoSchema } from '~/validations/user'
import { verifyHeaderCookie } from '~/utils/actions/verifyHeaderCookie'
import { safeParseSchema } from '~/utils/actions/safeParseSchema'
import { getNSFWHeader } from '~/utils/actions/getNSFWHeader'
import { GalgameCardSelectField } from '~/constants/api/select'

export const getUserFavorite = async (
  input: z.infer<typeof getUserInfoSchema>,
  nsfwEnable: Record<string, string | undefined>
) => {
  const { uid, page, limit } = input
  const offset = (page - 1) * limit

  const [data, total] = await Promise.all([
    await prisma.user_patch_favorite_relation.findMany({
      where: { user_id: uid, patch: nsfwEnable },
      include: {
        patch: {
          select: GalgameCardSelectField
        }
      },
      orderBy: { created: 'desc' },
      take: limit,
      skip: offset
    }),
    await prisma.user_patch_favorite_relation.count({
      where: { user_id: uid, patch: nsfwEnable }
    })
  ])

  const favorites: GalgameCard[] = data.map((gal) => ({
    ...gal.patch,
    tags: gal.patch.tag.map((t) => t.tag.name).slice(0, 3),
    uniqueId: gal.patch.unique_id
  }))

  return { favorites, total }
}

export const kunGetActions = async (
  params: z.infer<typeof getUserInfoSchema>
) => {
  const input = safeParseSchema(getUserInfoSchema, params)
  if (typeof input === 'string') {
    return input
  }
  const payload = await verifyHeaderCookie()
  if (!payload) {
    return '用户登陆失效'
  }

  const nsfwEnable = await getNSFWHeader()

  const response = await getUserFavorite(input, nsfwEnable)
  return response
}
