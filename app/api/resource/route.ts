import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { kunParseGetQuery } from '../utils/parseQuery'
import { prisma } from '~/prisma/index'
import { resourceSchema } from '~/validations/resource'
import { getNSFWHeader } from '~/app/api/utils/getNSFWHeader'
import type { PatchResource } from '~/types/api/resource'
import { getPatchResource } from './service'
export const GET = async (req: NextRequest) => {
  const input = kunParseGetQuery(req, resourceSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }
  const nsfwEnable = getNSFWHeader(req)

  const response = await getPatchResource(input, nsfwEnable)
  return NextResponse.json(response)
}
