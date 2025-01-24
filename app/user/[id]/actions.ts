'use server'

import { z } from 'zod'
import { prisma } from '~/prisma/index'
import { verifyHeaderCookie } from '~/utils/actions/verifyHeaderCookie'
import { safeParseSchema } from '~/utils/actions/safeParseSchema'

const getProfileSchema = z.object({
  id: z.coerce.number().min(1).max(9999999)
})

const getUserProfile = async (
  input: z.infer<typeof getProfileSchema>,
  currentUserUid: number
) => {
  const data = await prisma.user.findUnique({
    where: { id: input.id },
    include: {
      _count: {
        select: {
          patch_resource: true,
          patch: true,
          patch_comment: true,
          patch_favorite: true
        }
      },
      follower: true,
      following: true
    }
  })

  if (!data) {
    return '未找到用户'
  }

  const followerUserUid = data.following.map((f) => f.follower_id)

  return {
    id: data.id,
    requestUserUid: currentUserUid,
    name: data.name,
    email: data.email,
    avatar: data.avatar,
    bio: data.bio,
    role: data.role,
    status: data.status,
    registerTime: String(data.register_time),
    moemoepoint: data.moemoepoint,
    follower: data.following.length,
    following: data.follower.length,
    isFollow: followerUserUid.includes(currentUserUid),
    _count: data._count
  }
}

export const kunGetActions = async (id: number) => {
  const input = safeParseSchema(getProfileSchema, { id })
  if (typeof input === 'string') {
    return input
  }
  const payload = await verifyHeaderCookie()

  const user = await getUserProfile(input, payload?.uid ?? 0)
  return user
}
