import { z } from 'zod'
import { prisma } from '~/prisma/index'
import { galgameSchema } from '~/validations/galgame'
import {
  ALL_SUPPORTED_LANGUAGE,
  ALL_SUPPORTED_PLATFORM,
  ALL_SUPPORTED_TYPE
} from '~/constants/resource'
import { GalgameCardSelectField } from '~/constants/api/select'
import { getNSFWHeader } from '~/app/api/utils/getNSFWHeader'
import {
  buildGalgameDateFilter,
  buildGalgameOrderBy,
  buildGalgameWhere
} from '../utils/galgameQuery'
import { parseGalgameFilterArray } from '~/utils/galgameFilter'

export const getGalgame = async (
  input: z.infer<typeof galgameSchema>,
  nsfwEnable: Record<string, string | undefined>
) => {
  const {
    selectedType = 'all',
    selectedLanguage = 'all',
    selectedPlatform = 'all',
    sortField,
    sortOrder,
    page,
    limit,
    minRatingCount
  } = input
  const years = parseGalgameFilterArray(input.yearString)
  const months = parseGalgameFilterArray(input.monthString)

  const offset = (page - 1) * limit
  const dateFilter = buildGalgameDateFilter(years, months)
  const where = buildGalgameWhere({
    selectedType,
    selectedLanguage,
    selectedPlatform,
    minRatingCount,
    nsfwEnable
  })
  const orderBy = buildGalgameOrderBy(sortField, sortOrder)

  const [data, total] = await Promise.all([
    prisma.patch.findMany({
      take: limit,
      skip: offset,
      orderBy,
      where: {
        ...dateFilter,
        ...where
      },
      select: GalgameCardSelectField
    }),
    prisma.patch.count({
      where: {
        ...dateFilter,
        ...where
      }
    })
  ])

  const galgames: GalgameCard[] = data.map((gal) => ({
    id: gal.id,
    uniqueId: gal.unique_id,
    name: gal.name,
    banner: gal.banner,
    view: gal.view,
    download: gal.download,
    type: gal.type,
    language: gal.language,
    platform: gal.platform,
    tags: gal.tag.map((t) => t.tag.name).slice(0, 3),
    created: gal.created,
    _count: gal._count,
    averageRating: gal.rating_stat?.avg_overall
      ? Math.round(gal.rating_stat.avg_overall * 10) / 10
      : 0
  }))

  return { galgames, total }
}
