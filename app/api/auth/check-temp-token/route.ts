import { NextRequest, NextResponse } from 'next/server'
import { parseCookies } from '~/utils/cookies'
import { verify2FA } from '~/app/api/utils/verify2FA'

export const GET = async (req: NextRequest) => {
  const tempToken = parseCookies(req.headers.get('cookie') ?? '')[
    'kun-galgame-patch-moe-2fa-token'
  ]
  if (!tempToken) {
    return NextResponse.json('未找到临时令牌')
  }

  const payload = verify2FA(tempToken)
  if (!payload) {
    return NextResponse.json('2FA 临时令牌已过期, 时效为 10 分钟')
  }

  return NextResponse.json(payload)
}
