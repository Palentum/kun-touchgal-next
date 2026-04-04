import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { kunParsePostBody } from '~/app/api/utils/parseQuery'
import { verifyHeaderCookie } from '~/middleware/_verifyHeaderCookie'
import { createPatchCommentReportSchema } from '~/validations/patch'
import { createMessage } from '~/app/api/utils/message'
import { prisma } from '~/prisma'

const createReport = async (
  input: z.infer<typeof createPatchCommentReportSchema>,
  uid: number
) => {
  const comment = await prisma.patch_comment.findUnique({
    where: { id: input.commentId }
  })
  const patch = await prisma.patch.findUnique({
    where: { id: input.patchId }
  })
  const user = await prisma.user.findUnique({
    where: { id: uid }
  })

  const metadataLines: string[] = []
  if (comment?.id) {
    metadataLines.push(`举报评论ID: ${comment.id}`)
  }
  if (comment?.user_id) {
    metadataLines.push(`被举报用户ID: ${comment.user_id}`)
  }
  const metadata = metadataLines.length ? `\n${metadataLines.join('\n')}` : ''
  const STATIC_CONTENT = `${user?.name} 举报了「${patch?.name}」下的评论\n\n评论内容：${comment?.content.slice(0, 200)}${metadata}\n\n举报原因：${input.content}`
  const reportLink = (() => {
    if (!patch?.unique_id) {
      return ''
    }
    const params = new URLSearchParams()
    params.set('target', 'comment')
    if (comment?.id) {
      params.set('commentId', String(comment.id))
    }
    if (comment?.user_id) {
      params.set('reportedUid', String(comment.user_id))
    }
    const query = params.toString()
    return query ? `/${patch.unique_id}?${query}` : `/${patch.unique_id}`
  })()

  await createMessage({
    type: 'report',
    content: STATIC_CONTENT,
    sender_id: uid,
    link: reportLink
  })

  return {}
}

export const POST = async (req: NextRequest) => {
  const input = await kunParsePostBody(req, createPatchCommentReportSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }
  const payload = await verifyHeaderCookie(req)
  if (!payload) {
    return NextResponse.json('用户未登录')
  }

  const response = await createReport(input, payload.uid)
  return NextResponse.json(response)
}
