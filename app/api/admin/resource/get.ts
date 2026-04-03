import { z } from 'zod'
import { prisma } from '~/prisma/index'
import { adminResourcePaginationSchema } from '~/validations/admin'
import type { AdminResource } from '~/types/api/admin'

export const getPatchResource = async (
  input: z.infer<typeof adminResourcePaginationSchema>,
  nsfwEnable: Record<string, string | undefined>
) => {
  const { page, limit, search, userId } = input
  const offset = (page - 1) * limit

  const where = {
    ...(search
      ? {
          content: {
            contains: search,
            mode: 'insensitive' as const
          }
        }
      : {}),
    ...(userId ? { user_id: userId } : {}),
    patch: nsfwEnable
  }

  const [data, total] = await Promise.all([
    prisma.patch_resource.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { created: 'desc' },
      include: {
        patch: {
          select: {
            name: true,
            unique_id: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            role: true,
            _count: {
              select: {
                patch_resource: true
              }
            }
          }
        }
      }
    }),
    prisma.patch_resource.count({ where })
  ])

  const resources: AdminResource[] = data.map((resource) => ({
    id: resource.id,
    name: resource.name,
    section: resource.section,
    uniqueId: resource.patch.unique_id,
    patchName: resource.patch.name,
    storage: resource.storage,
    size: resource.size,
    type: resource.type,
    language: resource.language,
    note: resource.note,
    hash: resource.hash,
    content: resource.content,
    code: resource.code,
    password: resource.password,
    platform: resource.platform,
    likeCount: 0,
    isLike: false,
    status: resource.status,
    userId: resource.user_id,
    patchId: resource.patch_id,
    created: String(resource.created),
    user: {
      id: resource.user.id,
      name: resource.user.name,
      avatar: resource.user.avatar,
      patchCount: resource.user._count.patch_resource,
      role: resource.user.role
    }
  }))

  return { resources, total }
}
