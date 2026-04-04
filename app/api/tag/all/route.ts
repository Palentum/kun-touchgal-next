import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { kunParseGetQuery } from '~/app/api/utils/parseQuery'
import { prisma } from '~/prisma/index'
import { getTagSchema } from '~/validations/tag'
import type { Tag } from '~/types/api/tag'
import { getTag } from './service'
export const GET = async (req: NextRequest) => {
  const input = kunParseGetQuery(req, getTagSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }

  const response = await getTag(input)
  return NextResponse.json(response)
}
