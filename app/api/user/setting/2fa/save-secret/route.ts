import { prisma } from '~/prisma/index'
import { NextRequest, NextResponse } from 'next/server'
import { verifyHeaderCookie } from '~/middleware/_verifyHeaderCookie'
import { kunParsePostBody } from '~/app/api/utils/parseQuery'
import { saveUser2FASecretSchema } from '~/validations/user'

const saveSecret = async (uid: number, secret: string) => {
  await prisma.user.update({
    where: { id: uid },
    data: {
      two_factor_secret: secret,
      enable_2fa: false
    }
  })

  return { success: true }
}

export const POST = async (req: NextRequest) => {
  const input = await kunParsePostBody(req, saveUser2FASecretSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }
  const payload = await verifyHeaderCookie(req)
  if (!payload) {
    return NextResponse.json('用户未登录')
  }

  const result = await saveSecret(payload.uid, input.secret)
  return NextResponse.json(result)
}
