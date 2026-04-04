import { z } from 'zod'
import { prisma } from '~/prisma/index'
import { getPatchByTagSchema } from '~/validations/tag'
import { GalgameCardSelectField } from '~/constants/api/select'
import { getNSFWHeader } from '~/app/api/utils/getNSFWHeader'
import {
  ALL_SUPPORTED_LANGUAGE,
  ALL_SUPPORTED_PLATFORM,
  ALL_SUPPORTED_TYPE
} from '~/constants/resource'
import {
  buildGalgameDateFilter,
  buildGalgameOrderBy,
  buildGalgameWhere
} from '~/app/api/utils/galgameQuery'
import { parseGalgameFilterArray } from '~/utils/galgameFilter'

export const getPatchByTag = async (
  input: z.infer<typeof getPatchByTagSchema>,
  nsfwEnable: Record<string, string | undefined>
) => {
  const {
    tagId,
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
  const orderBy = { patch: buildGalgameOrderBy(sortField, sortOrder) }
  const patchWhere = {
    ...buildGalgameDateFilter(years, months),
    ...buildGalgameWhere({
      selectedType,
      selectedLanguage,
      selectedPlatform,
      minRatingCount: sortField === 'rating' ? minRatingCount : 0,
      nsfwEnable
    })
  }

  const [data, total] = await Promise.all([
    prisma.patch_tag_relation.findMany({
      where: { tag_id: tagId, patch: patchWhere },
      select: {
        patch: {
          select: GalgameCardSelectField
        }
      },
      orderBy,
      take: limit,
      skip: offset
    }),
    prisma.patch_tag_relation.count({
      where: { tag_id: tagId, patch: patchWhere }
    })
  ])

  const patches = data.map((p) => p.patch)
  const galgames: GalgameCard[] = patches.map((gal) => ({
    ...gal,
    tags: gal.tag.map((t) => t.tag.name).slice(0, 3),
    uniqueId: gal.unique_id,
    averageRating: gal.rating_stat?.avg_overall
      ? Math.round(gal.rating_stat.avg_overall * 10) / 10
      : 0
  }))

  return { galgames, total }
}
