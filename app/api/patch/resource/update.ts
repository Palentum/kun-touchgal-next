import { z } from 'zod'
import { prisma } from '~/prisma/index'
import { patchResourceUpdateSchema } from '~/validations/patch'
import {
  deletePatchResourceLink,
  uploadPatchResource,
  recalcPatchType
} from './_helper'
import type { PatchResource } from '~/types/api/patch'

export const updatePatchResource = async (
  input: z.infer<typeof patchResourceUpdateSchema>,
  uid: number,
  userRole: number
) => {
  const { resourceId, patchId, links, ...resourceData } = input
  const resource = await prisma.patch_resource.findUnique({
    where: { id: resourceId },
    include: {
      links: {
        orderBy: { sort_order: 'asc' }
      }
    }
  })
  if (!resource) {
    return '未找到该资源'
  }

  if (resource.user_id !== uid && userRole < 3) {
    return '您没有权限更改该资源'
  }

  const currentPatch = await prisma.patch.findUnique({
    where: { id: patchId },
    select: { name: true }
  })
  if (!currentPatch) {
    return '未找到该资源对应的 Galgame 信息, 请确认 Galgame 存在'
  }

  const existingLinksById = new Map(
    resource.links.map((link) => [link.id, link])
  )
  const nextLinkIds = new Set(
    links
      .map((link) => link.id)
      .filter((id): id is number => typeof id === 'number')
  )
  const linksToDelete = resource.links.filter(
    (link) => !nextLinkIds.has(link.id)
  )

  const preparedLinks: Array<{
    storage: string
    size: string
    code: string
    password: string
    hash: string
    content: string
    sort_order: number
    download: number
  }> = []
  const s3LinksToDelete: Array<{
    content: string
    patchId: number
    hash: string
  }> = []

  for (const removedLink of linksToDelete) {
    if (removedLink.storage === 's3') {
      s3LinksToDelete.push({
        content: removedLink.content,
        patchId: resource.patch_id,
        hash: removedLink.hash
      })
    }
  }

  for (const [index, link] of links.entries()) {
    const existingLink =
      typeof link.id === 'number' ? existingLinksById.get(link.id) : null

    let content = link.content

    if (link.storage === 's3') {
      if (
        existingLink &&
        existingLink.storage === 's3' &&
        existingLink.hash === link.hash
      ) {
        content = existingLink.content
      } else {
        const result = await uploadPatchResource(patchId, link.hash)
        if (typeof result === 'string') {
          return result
        }
        content = result.downloadLink
      }
    }

    if (
      existingLink &&
      existingLink.storage === 's3' &&
      (link.storage !== 's3' || existingLink.hash !== link.hash)
    ) {
      s3LinksToDelete.push({
        content: existingLink.content,
        patchId: resource.patch_id,
        hash: existingLink.hash
      })
    }

    preparedLinks.push({
      storage: link.storage,
      size: link.size,
      code: link.code,
      password: link.password,
      hash: link.hash,
      content,
      sort_order: index,
      download: existingLink?.download ?? 0
    })
  }

  const updatedResource = await prisma.$transaction(async (prisma) => {
    const newResource = await prisma.patch_resource.update({
      where: { id: resourceId },
      data: {
        ...resourceData,
        links: {
          deleteMany: {},
          create: preparedLinks
        }
      },
      include: {
        user: {
          include: {
            _count: {
              select: { patch_resource: true }
            }
          }
        },
        patch: {
          select: {
            unique_id: true
          }
        },
        links: {
          orderBy: { sort_order: 'asc' }
        }
      }
    })

    await prisma.patch.update({
      where: { id: patchId },
      data: { resource_update_time: new Date() }
    })
    await recalcPatchType(patchId, prisma)

    const resourceResponse: PatchResource = {
      id: newResource.id,
      name: newResource.name,
      section: newResource.section,
      uniqueId: newResource.patch.unique_id,
      type: newResource.type,
      language: newResource.language,
      note: newResource.note,
      platform: newResource.platform,
      links: newResource.links.map((link) => ({
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
      likeCount: 0,
      isLike: false,
      status: newResource.status,
      userId: newResource.user_id,
      patchId: newResource.patch_id,
      created: String(newResource.created),
      user: {
        id: newResource.user.id,
        name: newResource.user.name,
        avatar: newResource.user.avatar,
        patchCount: newResource.user._count.patch_resource,
        role: newResource.user.role
      }
    }

    return resourceResponse
  })

  for (const link of s3LinksToDelete) {
    await deletePatchResourceLink(link.content, link.patchId, link.hash)
  }

  return updatedResource
}
