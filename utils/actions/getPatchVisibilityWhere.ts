'use server'

import { getNSFWHeader } from './getNSFWHeader'
import { getBlockedTagIds } from './getBlockedTagIds'
import { buildBlockedTagWhere } from '~/utils/blockedTag'
import type { Prisma } from '~/prisma/generated/prisma/client'

export const getPatchVisibilityWhere =
  async (): Promise<Prisma.patchWhereInput> => {
    const blockedTagIds = await getBlockedTagIds()

    return {
      ...getNSFWHeader(),
      ...buildBlockedTagWhere(blockedTagIds)
    }
  }
