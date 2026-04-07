import { getNSFWHeader } from './getNSFWHeader'
import { getBlockedTagIds } from './getBlockedTagIds'
import { buildBlockedTagWhere } from '~/utils/blockedTag'
import type { NextRequest } from 'next/server'
import type { Prisma } from '~/prisma/generated/prisma/client'

export const getPatchVisibilityWhere = async (
  req: NextRequest
): Promise<Prisma.patchWhereInput> => {
  const blockedTagIds = await getBlockedTagIds(req)

  return {
    ...getNSFWHeader(req),
    ...buildBlockedTagWhere(blockedTagIds)
  }
}
