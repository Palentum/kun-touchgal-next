import { prisma } from '~/prisma/index'
import { NextRequest, NextResponse } from 'next/server'
import { verifyHeaderCookie } from '~/middleware/_verifyHeaderCookie'

const disable2FA = async (uid: number) => {
  await prisma.user.update({
    where: { id: uid },
    data: {
      enable_2fa: false,
      two_factor_secret: '',
      two_factor_backup: []
    }
  })

  return { success: true, message: '2FA 已禁用' }
}

export const POST = async (req: NextRequest) => {
  const payload = await verifyHeaderCookie(req)
  if (!payload) {
    return NextResponse.json('用户未登录')
  }

  const result = await disable2FA(payload.uid)
  return NextResponse.json(result)
}
