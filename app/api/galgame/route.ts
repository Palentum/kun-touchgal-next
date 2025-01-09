import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { kunParseGetQuery } from '../utils/parseQuery'
import { prisma } from '~/prisma/index'
import { galgameSchema } from '~/validations/galgame'
import { ALL_SUPPORTED_TYPE } from '~/constants/resource'
import { GalgameCardSelectField } from '~/constants/api/select'
import { getNSFWHeader } from '~/app/api/utils/getNSFWHeader'

export const getGalgame = async (
  input: z.infer<typeof galgameSchema>,
  nsfwEnable: Record<string, string | undefined>
) => {
  const { selectedType, sortField, sortOrder, page, limit } = input

  const offset = (page - 1) * limit

  const typeQuery =
    selectedType === 'all' ? {} : { type: { has: selectedType } }

  const [data, total] = await Promise.all([
    await prisma.patch.findMany({
      take: limit,
      skip: offset,
      orderBy: { [sortField]: sortOrder },
      where: { ...typeQuery, ...nsfwEnable },
      select: GalgameCardSelectField
    }),
    await prisma.patch.count({
      where: { ...typeQuery, ...nsfwEnable }
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
  if (!ALL_SUPPORTED_TYPE.includes(input.selectedType)) {
    return '请选择我们支持的 Galgame 类型'
  }
  const nsfwEnable = getNSFWHeader(req)

  const response = await getGalgame(input, nsfwEnable)
  return NextResponse.json(response)
}
