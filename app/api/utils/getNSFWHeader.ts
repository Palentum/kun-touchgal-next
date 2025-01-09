import { parseCookies } from '~/utils/cookies'
import type { NextRequest } from 'next/server'

export const getNSFWHeader = (req: NextRequest) => {
  const token = parseCookies(req.headers.get('cookie') ?? '')[
    'kun-patch-setting-store|state|data|kunNsfwEnable'
  ]
  return token === 'true'
}
