import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { kunParseGetQuery } from '../utils/parseQuery'
import { prisma } from '~/prisma/index'
import { galgameSchema } from '~/validations/galgame'
import {
  ALL_SUPPORTED_TYPE,
  ALL_SUPPORTED_LANGUAGE,
  ALL_SUPPORTED_PLATFORM
} from '~/constants/resource'
import { GalgameCardSelectField } from '~/constants/api/select'
import { getNSFWHeader } from '~/app/api/utils/getNSFWHeader'

export const getGalgame = async (
  input: z.infer<typeof galgameSchema>,
  nsfwEnable: Record<string, string | undefined>
) => {
  const {
    selectedType,
    selectedLanguage,
    selectedPlatform,
    sortField,
    sortOrder,
    page,
    limit
  } = input

  const offset = (page - 1) * limit

  const where = {
    ...(selectedType !== 'all' && { type: { has: selectedType } }),
    ...(selectedLanguage !== 'all' && { language: { has: selectedLanguage } }),
    ...(selectedPlatform !== 'all' && { platform: { has: selectedPlatform } }),
    ...nsfwEnable
  }

  const orderBy =
    sortField === 'favorite'
      ? { favorite_by: { _count: sortOrder } }
      : { [sortField]: sortOrder }

  const [data, total] = await Promise.all([
    prisma.patch.findMany({
      take: limit,
      skip: offset,
      orderBy,
      where,
      select: GalgameCardSelectField
    }),
    prisma.patch.count({
      where
    })
  ])

  const galgames: GalgameCard[] = data.map((gal) => ({
    ...gal,
    tags: gal.tag.map((t) => t.tag.name).slice(0, 3),
    uniqueId: gal.unique_id
  }))

  return { galgames, total }
}

export const GET = async (req: NextRequest) => {
  const input = kunParseGetQuery(req, galgameSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }
  if (
    !ALL_SUPPORTED_TYPE.includes(input.selectedType) ||
    !ALL_SUPPORTED_LANGUAGE.includes(input.selectedLanguage) ||
    !ALL_SUPPORTED_PLATFORM.includes(input.selectedPlatform)
  ) {
    return NextResponse.json('请选择我们支持的 Galgame 排序类型')
  }

  const nsfwEnable = getNSFWHeader(req)

  const response = await getGalgame(input, nsfwEnable)
  return NextResponse.json(response)
}
