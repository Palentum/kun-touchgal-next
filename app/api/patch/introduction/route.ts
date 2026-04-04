import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { kunParseGetQuery } from '~/app/api/utils/parseQuery'
import { prisma } from '~/prisma/index'
import { markdownToHtmlExtend } from '~/app/api/utils/render/markdownToHtmlExtend'
import { getKv, setKv } from '~/lib/redis'
import { PATCH_INTRODUCTION_CACHE_DURATION } from '~/config/cache'
import type { PatchIntroduction } from '~/types/api/patch'
import { getPatchIntroduction } from './service'

const uniqueIdSchema = z.object({
  uniqueId: z.string().min(8).max(8)
})
export const GET = async (req: NextRequest) => {
  const input = kunParseGetQuery(req, uniqueIdSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }

  const response = await getPatchIntroduction(input)
  return NextResponse.json(response)
}
