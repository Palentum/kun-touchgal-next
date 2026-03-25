import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '~/prisma'
import { getPatchByCompanySchema } from '~/validations/company'
import { kunParseGetQuery } from '~/app/api/utils/parseQuery'
import { GalgameCardSelectField } from '~/constants/api/select'
import { getNSFWHeader } from '~/app/api/utils/getNSFWHeader'

export const getPatchByCompany = async (
  input: z.infer<typeof getPatchByCompanySchema>,
  nsfwEnable: Record<string, string | undefined>
) => {
  const { companyId, page, limit, sortOrder } = input
  const offset = (page - 1) * limit
  const orderBy =
    input.sortField === 'favorite'
      ? { favorite_folder: { _count: sortOrder } }
      : input.sortField === 'rating'
        ? { rating_stat: { avg_overall: sortOrder } }
        : { [input.sortField]: sortOrder }
  const where = {
    company: {
      some: {
        company_id: companyId
      }
    },
    ...nsfwEnable
  }

  const [data, total] = await Promise.all([
    prisma.patch.findMany({
      where,
      select: GalgameCardSelectField,
      orderBy,
      take: limit,
      skip: offset
    }),
    prisma.patch.count({
      where
    })
  ])

  const galgames: GalgameCard[] = data.map((gal) => ({
    ...gal,
    tags: gal.tag.map((t) => t.tag.name).slice(0, 3),
    uniqueId: gal.unique_id,
    averageRating: gal.rating_stat?.avg_overall
      ? Math.round(gal.rating_stat.avg_overall * 10) / 10
      : 0
  }))

  return { galgames, total }
}

export const GET = async (req: NextRequest) => {
  const input = kunParseGetQuery(req, getPatchByCompanySchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }

  const nsfwEnable = getNSFWHeader(req)

  const response = await getPatchByCompany(input, nsfwEnable)
  return NextResponse.json(response)
}
