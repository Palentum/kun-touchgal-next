import path from 'path'
import { promises as fs } from 'fs'
import { NextRequest, NextResponse } from 'next/server'
import { kunParsePutBody } from '~/app/api/utils/parseQuery'
import { verifyHeaderCookie } from '~/middleware/_verifyHeaderCookie'
import { adminUpdateRedirectSchema } from '~/validations/admin'
import type { AdminRedirectConfig } from '~/types/api/admin'

const configPath = path.join(process.cwd(), 'lib/config/redirect.json')

export const POST = async (req: NextRequest) => {
  const input = await kunParsePutBody(req, adminUpdateRedirectSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }
  const payload = await verifyHeaderCookie(req)
  if (!payload) {
    return NextResponse.json('用户未登录')
  }
  if (payload.role < 3) {
    return NextResponse.json('本页面仅管理员可访问')
  }

  await fs.writeFile(
    configPath,
    JSON.stringify(input as AdminRedirectConfig, null, 2)
  )

  return NextResponse.json({})
}
