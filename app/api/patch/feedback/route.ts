import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { kunParsePostBody } from '~/app/api/utils/parseQuery'
import { verifyHeaderCookie } from '~/middleware/_verifyHeaderCookie'
import { createPatchFeedbackSchema } from '~/validations/patch'
import { createMessage } from '~/app/api/utils/message'
import { prisma } from '~/prisma'

export const createFeedback = async (
  input: z.infer<typeof createPatchFeedbackSchema>,
  uid: number
) => {
  const patch = await prisma.patch.findUnique({
    where: { id: input.patchId }
  })
  const user = await prisma.user.findUnique({
    where: { id: uid }
  })

  const STATIC_CONTENT = `用户: ${user?.name} 对 游戏: ${patch?.name} 提交了一个反馈\n\n`

  await createMessage({
    type: 'feedback',
    content: `${STATIC_CONTENT}${input.content}`,
    patch_unique_id: patch?.unique_id,
    sender_id: uid
  })

  return {}
}

export const POST = async (req: NextRequest) => {
  const input = await kunParsePostBody(req, createPatchFeedbackSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }
  const payload = await verifyHeaderCookie(req)
  if (!payload) {
    return NextResponse.json('用户未登录')
  }

  const response = await createFeedback(input, payload.uid)
  return NextResponse.json(response)
}
