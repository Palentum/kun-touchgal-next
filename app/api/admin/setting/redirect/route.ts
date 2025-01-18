import path from 'path'
import { promises as fs } from 'fs'
import { NextRequest, NextResponse } from 'next/server'
import { kunParsePutBody } from '~/app/api/utils/parseQuery'
import { verifyHeaderCookie } from '~/middleware/_verifyHeaderCookie'
import { adminUpdateRedirectSchema } from '~/validations/admin'
import type { AdminRedirectConfig } from '~/types/api/admin'

const configPath = path.resolve(__dirname, 'config/redirect.json')

export const GET = async (req: NextRequest) => {
  const payload = await verifyHeaderCookie(req)
  if (!payload) {
    return NextResponse.json('用户未登录')
  }
  if (payload.role < 3) {
    return NextResponse.json('本页面仅管理员可访问')
  }

  const redirectJsonFile = (await fs.readFile(
    configPath,
    'utf8'
  )) as unknown as string

  const setting = JSON.parse(redirectJsonFile)

  return NextResponse.json({ setting })
}

export const PUT = async (req: NextRequest) => {
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
