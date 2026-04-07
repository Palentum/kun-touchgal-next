import { parseCookies } from '~/utils/cookies'
import { parseBlockedTagIds } from '~/utils/blockedTag'
import { verifyKunToken } from './jwt'
import { prisma } from '~/prisma'
import type { NextRequest } from 'next/server'

export const getBlockedTagIds = async (req: NextRequest) => {
  const cookies = parseCookies(req.headers.get('cookie') ?? '')
  const token = cookies['kun-galgame-patch-moe-token']
  if (!token) {
    return []
  }

  const cachedBlockedTagIds =
    cookies['kun-patch-setting-store|state|data|kunBlockedTagIds']
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
}
