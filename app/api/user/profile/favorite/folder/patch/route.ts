import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { kunParseGetQuery } from '~/app/api/utils/parseQuery'
import { verifyHeaderCookie } from '~/middleware/_verifyHeaderCookie'
import { prisma } from '~/prisma/index'

const folderIdSchema = z.object({
  folderId: z.coerce.number().min(1).max(9999999)
})

export const GET = async (req: NextRequest) => {
  const input = kunParseGetQuery(req, folderIdSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }
  const payload = await verifyHeaderCookie(req)

  const res = await getPatchByFolder(input.folderId, payload?.uid ?? 0)
  return NextResponse.json(res)
}

const getPatchByFolder = async (folderId: number, uid?: number) => {
  const folder = await prisma.user_patch_favorite_folder.findUnique({
    where: { id: folderId }
  })
  if (!folder) {
    return '未找到该文件夹'
  }

  const data = await prisma.user_patch_favorite_folder.findMany({
    where: {
      id: folderId,
      is_public: folder.user_id === uid
    },
    include: {
      patch: {
        include: {
          patch: {
            include: {
              tag: {
                select: {
                  tag: {
                    select: { name: true }
                  }
                }
              },
              _count: {
                select: {
                  favorite_folder: true,
                  resource: true,
                  comment: true
                }
              }
            }
          }
        }
      }
    }
  })

  const patches = data.map((p) => p.patch).flat()
  const response: GalgameCard[] = patches.map((relation) => ({
    id: relation.patch.id,
    uniqueId: relation.patch.unique_id,
    name: relation.patch.name,
    banner: relation.patch.banner,
    view: relation.patch.view,
    download: relation.patch.download,
    type: relation.patch.type,
    language: relation.patch.language,
    platform: relation.patch.platform,
    tags: relation.patch.tag.map((t) => t.tag.name),
    created: relation.patch.created,
    _count: relation.patch._count
  }))
  return response
}
