import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '~/prisma/index'
import { getPatchVisibilityWhere } from '~/app/api/utils/getPatchVisibilityWhere'
import type { Prisma } from '~/prisma/generated/prisma/client'

const getRandomUniqueId = async (
  visibilityWhere: Prisma.patchWhereInput
) => {
  const totalArticles = await prisma.patch.findMany({
    where: visibilityWhere,
    select: { unique_id: true }
  })
  if (totalArticles.length === 0) {
    return '未查询到文章'
  }
  const uniqueIds = totalArticles.map((a) => a.unique_id)
  const randomIndex = Math.floor(Math.random() * uniqueIds.length)

  return { uniqueId: uniqueIds[randomIndex] }
}

export const GET = async (req: NextRequest) => {
  const visibilityWhere = await getPatchVisibilityWhere(req)

  const response = await getRandomUniqueId(visibilityWhere)
  return NextResponse.json(response)
}
