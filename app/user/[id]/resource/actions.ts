'use server'

import { z } from 'zod'
import { prisma } from '~/prisma/index'
import { getUserInfoSchema } from '~/validations/user'
import { verifyHeaderCookie } from '~/utils/actions/verifyHeaderCookie'
import { safeParseSchema } from '~/utils/actions/safeParseSchema'
import { getNSFWHeader } from '~/utils/actions/getNSFWHeader'
import type { UserResource } from '~/types/api/user'

export const getUserPatchResource = async (
  input: z.infer<typeof getUserInfoSchema>,
  nsfwEnable: Record<string, string | undefined>
) => {
  const { uid, page, limit } = input
  const offset = (page - 1) * limit

  const [data, total] = await Promise.all([
    await prisma.patch_resource.findMany({
      where: { user_id: uid, patch: nsfwEnable },
      include: {
        patch: true
      },
      orderBy: { created: 'desc' },
      skip: offset,
      take: limit
    }),
    await prisma.patch_resource.count({
      where: { user_id: uid, patch: nsfwEnable }
    })
  ])

  const resources: UserResource[] = data.map((res) => ({
    id: res.id,
    patchUniqueId: res.patch.unique_id,
    patchId: res.patch.id,
    patchName: res.patch.name,
    patchBanner: res.patch.banner,
    size: res.size,
    type: res.type,
    language: res.language,
    platform: res.platform,
    created: String(res.created)
  }))

  return { resources, total }
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

  const response = await getUserPatchResource(input, nsfwEnable)
  return response
}
