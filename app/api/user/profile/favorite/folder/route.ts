import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '~/prisma/index'
import { verifyHeaderCookie } from '~/middleware/_verifyHeaderCookie'
import { createFavoriteFolderSchema } from '~/validations/user'
import {
  kunParseGetQuery,
  kunParsePostBody,
  kunParseDeleteQuery
} from '~/app/api/utils/parseQuery'
import { createFolder } from './create'
import { deleteFolder } from './delete'
import type { UserFavoritePatchFolder } from '~/types/api/user'

const folderIdSchema = z.object({
  folderId: z.coerce.number().min(1).max(9999999)
})

const patchIdSchema = z.object({
  patchId: z.coerce.number().min(1).max(9999999).optional()
})

export const GET = async (req: NextRequest) => {
  const input = kunParseGetQuery(req, patchIdSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }
  const payload = await verifyHeaderCookie(req)
  if (!payload) {
    return NextResponse.json('用户未登录')
  }

  const folders = await prisma.user_patch_favorite_folder.findMany({
    where: { user_id: payload.uid },
    include: {
      patch: {
        where: {
          patch_id: input.patchId ?? 0
        }
      },
      _count: {
        select: { patch: true }
      }
    }
  })

  const response: UserFavoritePatchFolder[] = folders.map((f) => ({
    name: f.name,
    id: f.id,
    description: f.description,
    is_public: f.is_public,
    isAdd: f.patch.length > 0,
    _count: f._count
  }))

  return NextResponse.json(response)
}

export const POST = async (req: NextRequest) => {
  const input = await kunParsePostBody(req, createFavoriteFolderSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }
  const payload = await verifyHeaderCookie(req)
  if (!payload) {
    return NextResponse.json('用户未登录')
  }

  const res = await createFolder(input, payload.uid)
  return NextResponse.json(res)
}

export const DELETE = async (req: NextRequest) => {
  const input = kunParseDeleteQuery(req, folderIdSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }
  const payload = await verifyHeaderCookie(req)
  if (!payload) {
    return NextResponse.json('用户未登录')
  }

  const res = await deleteFolder(input, payload.uid)
  return NextResponse.json(res)
}
