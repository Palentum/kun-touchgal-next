'use server'

import { cache } from 'react'
import { cookies } from 'next/headers'
import { parseBlockedTagIds } from '~/utils/blockedTag'
import { verifyKunToken } from '~/app/api/utils/jwt'
import { prisma } from '~/prisma'

export const getBlockedTagIds = cache(async () => {
  const cookieStore = await cookies()
  const token = cookieStore.get('kun-galgame-patch-moe-token')?.value
  if (!token) {
    return []
  }

  const cachedBlockedTagIds = cookieStore.get(
    'kun-patch-setting-store|state|data|kunBlockedTagIds'
  )?.value
  if (cachedBlockedTagIds !== undefined) {
    return parseBlockedTagIds(cachedBlockedTagIds)
  }

  const payload = await verifyKunToken(token)
  if (!payload) {
    return []
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.uid },
    select: { blocked_tag_ids: true }
  })

  return user?.blocked_tag_ids ?? []
})
