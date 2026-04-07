import type { SortField, SortOrder } from '~/components/galgame/_sort'
import type { Prisma } from '~/prisma/generated/prisma/client'

interface BuildGalgameWhereOptions {
  selectedType?: string
  selectedLanguage?: string
  selectedPlatform?: string
  minRatingCount?: number
  visibilityWhere: Prisma.patchWhereInput
}

export const buildGalgameDateFilter = (
  years: string[],
  months: string[]
): Prisma.patchWhereInput => {
  if (years.includes('all')) {
    return {}
  }

  const dateConditions: Prisma.patchWhereInput[] = []

  if (years.includes('future')) {
    dateConditions.push({ released: 'future' })
  }

  if (years.includes('unknown')) {
    dateConditions.push({ released: 'unknown' })
  }

  const exactYears = years.filter(
    (year) => year !== 'future' && year !== 'unknown'
  )

  if (exactYears.length > 0) {
    if (!months.includes('all')) {
      dateConditions.push(
        ...exactYears.flatMap((year) =>
          months.map((month) => ({
            released: {
              startsWith: `${year}-${month}`
            }
          }))
        )
      )
    } else {
      dateConditions.push(
        ...exactYears.map((year) => ({
          released: {
            startsWith: year
          }
        }))
      )
    }
  }

  return dateConditions.length > 0 ? { OR: dateConditions } : {}
}

export const buildGalgameWhere = ({
  selectedType = 'all',
  selectedLanguage = 'all',
  selectedPlatform = 'all',
  minRatingCount = 0,
  visibilityWhere
}: BuildGalgameWhereOptions): Prisma.patchWhereInput => {
  return {
    ...(selectedType !== 'all' && { type: { has: selectedType } }),
    ...(selectedLanguage !== 'all' && { language: { has: selectedLanguage } }),
    ...(selectedPlatform !== 'all' && { platform: { has: selectedPlatform } }),
    ...(minRatingCount > 0 && {
      rating_stat: {
        count: {
          gte: minRatingCount
        }
      }
    }),
    ...visibilityWhere
  }
}

export const buildGalgameOrderBy = (
  sortField: SortField,
  sortOrder: SortOrder
): Prisma.patchOrderByWithRelationInput => {
  if (sortField === 'favorite') {
    return { favorite_folder: { _count: sortOrder } }
  }

  if (sortField === 'rating') {
    return { rating_stat: { avg_overall: sortOrder } }
  }

  return { [sortField]: sortOrder }
}
