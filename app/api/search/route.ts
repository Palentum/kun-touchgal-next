import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { kunParsePostBody } from '~/app/api/utils/parseQuery'
import { prisma } from '~/prisma/index'
import { searchSchema } from '~/validations/search'
import { GalgameCardSelectField } from '~/constants/api/select'
import { getPatchVisibilityWhere } from '~/app/api/utils/getPatchVisibilityWhere'
import { Prisma } from '~/prisma/generated/prisma/client'
import type { SearchSuggestionType } from '~/types/api/search'
import {
  buildGalgameDateFilter,
  buildGalgameOrderBy,
  buildGalgameWhere
} from '../utils/galgameQuery'

const searchGalgame = async (
  input: z.infer<typeof searchSchema>,
  visibilityWhere: Prisma.patchWhereInput
) => {
  const {
    queryString,
    limit,
    searchOption,
    page,
    selectedType = 'all',
    selectedLanguage = 'all',
    selectedPlatform = 'all',
    sortField,
    sortOrder,
    selectedYears = ['all'],
    selectedMonths = ['all'],
    minRatingCount
  } = input
  const offset = (page - 1) * limit
  const insensitive = Prisma.QueryMode.insensitive

  const query = JSON.parse(queryString) as SearchSuggestionType[]

  const queryArray = query
    .filter((item) => item.type === 'keyword')
    .map((item) => item.name)
  const tagArray = query
    .filter((item) => item.type === 'tag')
    .map((item) => item.name)
  const companyArray = query
    .filter((item) => item.type === 'company')
    .map((item) => item.name)

  const dateFilter = buildGalgameDateFilter(selectedYears, selectedMonths)
  const where = buildGalgameWhere({
    selectedType,
    selectedLanguage,
    selectedPlatform,
    minRatingCount: sortField === 'rating' ? minRatingCount : 0,
    visibilityWhere
  })
  const orderBy = buildGalgameOrderBy(sortField, sortOrder)

  const queryCondition = [
    ...queryArray.map((q) => ({
      OR: [
        { name: { contains: q, mode: insensitive } },
        { vndb_id: q },
        { vndb_relation_id: q },
        { dlsite_code: q },
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

    visibilityWhere,

    ...tagArray.map((q) => ({
      tag: {
        some: {
          tag: {
            OR: [{ name: q }, { alias: { has: q } }]
          }
        }
      }
    })),
    ...companyArray.map((q) => ({
      company: {
        some: {
          company: {
            OR: [
              { name: q },
              { alias: { has: q } },
              { parent_brand: { has: q } }
            ]
          }
        }
      }
    }))
  ]

  const [data, total] = await Promise.all([
    prisma.patch.findMany({
      take: limit,
      skip: offset,
      orderBy,
      where: { AND: queryCondition, ...dateFilter, ...where },
      select: GalgameCardSelectField
    }),
    await prisma.patch.count({
      where: { AND: queryCondition, ...dateFilter, ...where }
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

export const POST = async (req: NextRequest) => {
  const input = await kunParsePostBody(req, searchSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }
  const visibilityWhere = await getPatchVisibilityWhere(req)

  const response = await searchGalgame(input, visibilityWhere)
  return NextResponse.json(response)
}
