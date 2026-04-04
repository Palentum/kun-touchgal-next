import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { kunParseGetQuery } from '../utils/parseQuery'
import { prisma } from '~/prisma/index'
import { commentSchema } from '~/validations/comment'
import { markdownToText } from '~/utils/markdownToText'
import { verifyHeaderCookie } from '~/middleware/_verifyHeaderCookie'
import type { PatchComment } from '~/types/api/comment'
import { getComment } from './service'
export const GET = async (req: NextRequest) => {
  const input = kunParseGetQuery(req, commentSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }
  const payload = await verifyHeaderCookie(req)
  if (!payload) {
    return NextResponse.json('用户登陆失效')
  }

  const response = await getComment(input)
  return NextResponse.json(response)
}
