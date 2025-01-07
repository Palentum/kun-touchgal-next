import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { kunParseGetQuery } from '~/app/api/utils/parseQuery'
import { prisma } from '~/prisma/index'
import { markdownToHtmlExtend } from '~/app/api/utils/markdownToHtmlExtend'
import type { PatchIntroduction } from '~/types/api/patch'

const uniqueIdSchema = z.object({
  uniqueId: z.string().min(8).max(8)
})

export const getPatchIntroduction = async (
  input: z.infer<typeof uniqueIdSchema>
) => {
  const { uniqueId } = input

  const patch = await prisma.patch.findUnique({
    where: { unique_id: uniqueId },
    include: {
      tag: {
        include: {
          tag: {
            select: {
              id: true,
              name: true,
              count: true,
              alias: true
            }
          }
        }
      }
    }
  })
  if (!patch) {
    return '未找到对应 Galgame'
  }

  const response: PatchIntroduction = {
    vndbId: patch.vndb_id,
    introduction: await markdownToHtmlExtend(patch.introduction),
    released: patch.released,
    alias: patch.alias,
    tag: patch.tag.map((tag) => tag.tag),
    created: String(patch.created),
    updated: String(patch.updated)
  }

  return response
}

export const GET = async (req: NextRequest) => {
  const input = kunParseGetQuery(req, uniqueIdSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }

  const response = await getPatchIntroduction(input)
  return NextResponse.json(response)
}
