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

  const [galgames, total] = await Promise.all([
    await prisma.patch.findMany({
      where: {
        OR: [
          nsfwEnable,
          {
            tag: {
              some: {
                tag: {
                  OR: [{ name: { in: query } }, { alias: { hasSome: query } }]
                }
              }
            }
          }
        ]
      },
      select: GalgameCardSelectField,
      orderBy: { created: 'desc' },
      take: limit,
      skip: offset
    }),
    await prisma.patch.count({
      where: {
        OR: [
          nsfwEnable,
          {
            tag: {
              some: {
                tag: {
                  OR: [{ name: { in: query } }, { alias: { hasSome: query } }]
                }
              }
            }
          }
        ]
      }
    })
  ])

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
