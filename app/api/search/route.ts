import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { kunParsePostBody } from '~/app/api/utils/parseQuery'
import { prisma } from '~/prisma/index'
import { searchSchema } from '~/validations/search'
import { GalgameCardSelectField } from '~/constants/api/select'
import { getNSFWHeader } from '~/app/api/utils/getNSFWHeader'
import { Prisma } from '@prisma/client'

export const searchGalgame = async (
  input: z.infer<typeof searchSchema>,
  nsfwEnable: Record<string, string | undefined>
) => {
  const { query, page, limit, searchOption } = input
  const offset = (page - 1) * limit
  const insensitive = Prisma.QueryMode.insensitive

  const data = await prisma.patch.findMany({
    where: {
      AND: query.map((q) => ({
        OR: [
          { name: { contains: q, mode: insensitive } },
          { vndb_id: { contains: q, mode: insensitive } },
          ...(searchOption.searchInIntroduction
            ? [{ introduction: { contains: q, mode: insensitive } }]
            : []),
          ...(searchOption.searchInAlias
            ? [
                {
                  alias: {
                    some: {
                      name: { contains: q, mode: insensitive }
                    }
                  }
                }
              ]
            : []),
          ...(searchOption.searchInTag
            ? [
                {
                  tag: {
                    some: {
                      tag: { name: { contains: q, mode: insensitive } }
                    }
                  }
                }
              ]
            : [])
        ]
      })),
      ...nsfwEnable
    },
    select: GalgameCardSelectField,
    orderBy: { created: 'desc' },
    take: limit,
    skip: offset
  })

  const total = await prisma.patch.count({
    where: {
      AND: query.map((q) => ({
        OR: [
          { name: { contains: q, mode: insensitive } },
          { vndb_id: { contains: q, mode: insensitive } },
          ...(searchOption.searchInIntroduction
            ? [{ introduction: { contains: q, mode: insensitive } }]
            : []),
          ...(searchOption.searchInAlias
            ? [
                {
                  alias: {
                    some: {
                      name: { contains: q, mode: insensitive }
                    }
                  }
                }
              ]
            : []),
          ...(searchOption.searchInTag
            ? [
                {
                  tag: {
                    some: {
                      tag: { name: { contains: q, mode: insensitive } }
                    }
                  }
                }
              ]
            : [])
        ]
      })),
      ...nsfwEnable
    }
  })

  const galgames: GalgameCard[] = data.map((gal) => ({
    ...gal,
    tags: gal.tag.map((t) => t.tag.name).slice(0, 3),
    uniqueId: gal.unique_id
  }))

  return { galgames, total }
}

export const POST = async (req: NextRequest) => {
  const input = await kunParsePostBody(req, searchSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }
  const nsfwEnable = getNSFWHeader(req)

  const response = await searchGalgame(input, nsfwEnable)
  return NextResponse.json(response)
}
