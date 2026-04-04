import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '~/prisma/index'
import { GalgameCardSelectField } from '~/constants/api/select'
import { rankingSchema } from '~/validations/ranking'
import { kunParseGetQuery } from '~/app/api/utils/parseQuery'
import { getNSFWHeader } from '~/app/api/utils/getNSFWHeader'
import type { RankingSortField, RankingCard } from '~/types/api/ranking'
import type { Prisma } from '~/prisma/generated/prisma/client'
import { getRanking } from './service'

export const GET = async (req: NextRequest) => {
  const input = kunParseGetQuery(req, rankingSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }

  const nsfwEnable = getNSFWHeader(req)

  const response = await getRanking(input, nsfwEnable)
  return NextResponse.json(response)
}
