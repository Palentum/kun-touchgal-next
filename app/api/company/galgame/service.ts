import { z } from 'zod'
import { prisma } from '~/prisma'
import { getPatchByCompanySchema } from '~/validations/company'
import {
  GalgameCardSelectField,
  toGalgameCardCount
} from '~/constants/api/select'
import {
  buildGalgameDateFilter,
  buildGalgameOrderBy,
  buildGalgameWhere
} from '~/app/api/utils/galgameQuery'
import { parseGalgameFilterArray } from '~/utils/galgameFilter'
import type { Prisma } from '~/prisma/generated/prisma/client'

export const getPatchByCompany = async (
  input: z.infer<typeof getPatchByCompanySchema>,
  visibilityWhere: Prisma.patchWhereInput
) => {
  const {
    companyId,
    page,
    limit,
    sortField,
    sortOrder,
    selectedType,
    selectedLanguage,
    selectedPlatform,
    yearString,
    monthString,
    minRatingCount
  } = input
  const offset = (page - 1) * limit
  const years = parseGalgameFilterArray(yearString)
  const months = parseGalgameFilterArray(monthString)
  const orderBy = buildGalgameOrderBy(sortField, sortOrder)
  const where = {
    company: {
      some: {
        company_id: companyId
      }
    },
    ...buildGalgameDateFilter(years, months),
    ...buildGalgameWhere({
      selectedType,
      selectedLanguage,
      selectedPlatform,
      minRatingCount: sortField === 'rating' ? minRatingCount : 0,
      visibilityWhere
    })
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

  const galgames: GalgameCard[] = data.map((gal) => {
    const { favorite_count, resource_count, comment_count, ...rest } = gal
    return {
      ...rest,
      tags: gal.tag.map((t) => t.tag.name).slice(0, 3),
      uniqueId: gal.unique_id,
      _count: toGalgameCardCount({
        favorite_count,
        resource_count,
        comment_count
      }),
      averageRating: gal.rating_stat?.avg_overall
        ? Math.round(gal.rating_stat.avg_overall * 10) / 10
        : 0
    }
  })

  return { galgames, total }
}
