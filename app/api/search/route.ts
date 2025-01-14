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
  const { query, page, limit, searchOptions } = input

  const offset = (page - 1) * limit
  const insensitive = Prisma.QueryMode.insensitive

  const data = await Promise.all(
    query.map(async (q) =>
      prisma.patch.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: insensitive } },
            { vndb_id: { contains: q, mode: insensitive } },
            ...(searchOptions.searchInIntroduction
              ? [
                  {
                    introduction: {
                      contains: q,
                      mode: insensitive
                    }
                  }
                ]
              : []),
            ...(searchOptions.searchInAlias ? [{ alias: { has: q } }] : []),
            ...(searchOptions.searchInTags
              ? [
                  {
                    tag: {
                      some: {
                        tag: {
                          name: {
                            contains: q,
                            mode: insensitive
                          }
                        }
                      }
                    }
                  }
                ]
              : [])
          ],
          ...nsfwEnable
        },
        select: GalgameCardSelectField,
        orderBy: { created: 'desc' },
        take: limit,
        skip: offset
      })
    )
  )

  const total = await prisma.patch.count({
    where: {
      OR: query.map((q) => ({
        OR: [
          { name: { contains: q, mode: insensitive } },
          { vndb_id: { contains: q, mode: insensitive } },
          ...(searchOptions.searchInIntroduction
            ? [
                {
                  introduction: {
                    contains: q,
                    mode: insensitive
                  }
                }
              ]
            : []),
          ...(searchOptions.searchInAlias ? [{ alias: { hasSome: [q] } }] : []),
          ...(searchOptions.searchInTags
            ? [
                {
                  tag: {
                    some: {
                      tag: {
                        name: {
                          contains: q,
                          mode: insensitive
                        }
                      }
                    }
                  }
                }
              ]
            : [])
        ],
        ...nsfwEnable
      }))
    }
  })

  const galgames: GalgameCard[] = data.flat().map((gal) => ({
    ...gal,
    tags: gal.tag.map((t) => t.tag.name).slice(0, 3),
    uniqueId: gal.unique_id
  }))
  const uniqueGalgames: GalgameCard[] = Array.from(
    galgames
      .reduce(
        (map, gal) => map.set(gal.id, gal),
        new Map<number, GalgameCard>()
      )
      .values()
  )

  return { galgames: uniqueGalgames, total }
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
