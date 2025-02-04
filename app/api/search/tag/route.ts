import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { kunParsePostBody } from '~/app/api/utils/parseQuery'
import { prisma } from '~/prisma/index'
import { searchGalgameByTagSchema } from '~/validations/tag'
import { GalgameCardSelectField } from '~/constants/api/select'
import { getNSFWHeader } from '~/app/api/utils/getNSFWHeader'

export const searchGalgameByTag = async (
  input: z.infer<typeof searchGalgameByTagSchema>,
  nsfwEnable: Record<string, string | undefined>
) => {
  const { query, page, limit } = input
  const offset = (page - 1) * limit

  const [data, total] = await Promise.all([
    prisma.patch.findMany({
      where: {
        AND: [
          nsfwEnable,
          ...query.map((q) => ({
            tag: {
              some: {
                tag: {
                  OR: [{ name: q }, { alias: { has: q } }]
                }
              }
            }
          }))
        ]
      },
      select: GalgameCardSelectField,
      orderBy: { created: 'desc' },
      take: limit,
      skip: offset
    }),
    prisma.patch.count({
      where: {
        AND: [
          nsfwEnable,
          ...query.map((q) => ({
            tag: {
              some: {
                tag: {
                  OR: [{ name: q }, { alias: { has: q } }]
                }
              }
            }
          }))
        ]
      }
    })
  ])

  const galgames = data.map((gal) => ({
    ...gal,
    tags: gal.tag.map((t) => t.tag.name).slice(0, 3),
    uniqueId: gal.unique_id
  }))

  return { galgames, total }
}

export const POST = async (req: NextRequest) => {
  const input = await kunParsePostBody(req, searchGalgameByTagSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }
  const nsfwEnable = getNSFWHeader(req)

  const response = await searchGalgameByTag(input, nsfwEnable)
  return NextResponse.json(response)
}
