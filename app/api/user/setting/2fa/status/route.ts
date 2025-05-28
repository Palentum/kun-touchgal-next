import { prisma } from '~/prisma/index'
import { NextRequest, NextResponse } from 'next/server'
import { verifyHeaderCookie } from '~/middleware/_verifyHeaderCookie'

const get2FAStatus = async (uid?: number) => {
  if (!uid) {
    return { enabled: false, hasSecret: false }
  }

  const user = await prisma.user.findUnique({
    where: { id: uid },
    select: {
      enable_2fa: true,
      two_factor_secret: true,
      two_factor_backup: true
    }
  })

  return {
    enabled: user?.enable_2fa || false,
    hasSecret: !!user?.two_factor_secret,
    backupCodeLength: user?.two_factor_backup
      ? user.two_factor_backup.length
      : 0
  }
}

export const GET = async (req: NextRequest) => {
  const payload = await verifyHeaderCookie(req)
  const result = await get2FAStatus(payload?.uid)
  return NextResponse.json(result)
}
