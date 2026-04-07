import { z } from 'zod'
import { prisma } from '~/prisma/index'
import { resourceSchema } from '~/validations/resource'
import type { Prisma } from '~/prisma/generated/prisma/client'
import type { PatchResource } from '~/types/api/resource'

export const getPatchResource = async (
  input: z.infer<typeof resourceSchema>,
  visibilityWhere: Prisma.patchWhereInput
) => {
  const { sortField, sortOrder, page, limit } = input

  const offset = (page - 1) * limit

  const orderByField =
    sortField === 'like'
      ? { like_by: { _count: sortOrder } }
      : { [sortField]: sortOrder }

  const [resourcesData, total] = await Promise.all([
    prisma.patch_resource.findMany({
      take: limit,
      skip: offset,
      orderBy: orderByField,
      where: { patch: visibilityWhere, section: 'patch', status: 0 },
      include: {
        patch: {
          select: {
            name: true,
            unique_id: true
          }
        },
        user: {
          include: {
            _count: {
              select: { patch_resource: true }
            }
          }
        },
        links: {
          orderBy: { sort_order: 'asc' }
        },
        _count: {
          select: {
            like_by: true
          }
        }
      }
    }),
    prisma.patch_resource.count({
      where: { patch: visibilityWhere, section: 'patch', status: 0 }
    })
  ])

  const resources: PatchResource[] = resourcesData.map((resource) => ({
    id: resource.id,
    name: resource.name,
    section: resource.section,
    uniqueId: resource.patch.unique_id,
    type: resource.type,
    language: resource.language,
    note: resource.note.slice(0, 233),
    platform: resource.platform,
    links: resource.links.map((link) => ({
      id: link.id,
      storage: link.storage,
      size: link.size,
      code: link.code,
      password: link.password,
      hash: link.hash,
      content: link.content,
      sortOrder: link.sort_order,
      download: link.download
    })),
    likeCount: resource._count.like_by,
    download: resource.download,
    patchId: resource.patch_id,
    patchName: resource.patch.name,
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
