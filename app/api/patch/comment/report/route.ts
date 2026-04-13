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
    where: { id: input.commentId },
    select: {
      id: true,
      content: true,
      user_id: true,
      patch_id: true
    }
  })
  if (!comment) {
    return '评论不存在'
  }
  if (comment.patch_id !== input.patchId) {
    return '评论不属于当前游戏'
  }
  if (comment.user_id === uid) {
    return '不能举报自己的评论'
  }

  const existingReport = await prisma.user_message.findFirst({
    where: {
      type: 'report',
      sender_id: uid,
      recipient_id: null,
      status: 0,
      link: { contains: `commentId=${input.commentId}&` }
    },
    select: { id: true }
  })
  if (existingReport) {
    return '您已经举报过该评论，请等待管理员处理'
  }

  const [patch, user] = await Promise.all([
    prisma.patch.findUnique({
      where: { id: input.patchId },
      select: {
        name: true,
        unique_id: true
      }
    }),
    prisma.user.findUnique({
      where: { id: uid },
      select: {
        name: true
      }
    })
  ])
  if (!patch) {
    return '游戏不存在'
  }

  const metadataLines: string[] = []
  metadataLines.push(`举报评论ID: ${comment.id}`)
  metadataLines.push(`被举报用户ID: ${comment.user_id}`)
  const metadata = metadataLines.length ? `\n${metadataLines.join('\n')}` : ''
  const STATIC_CONTENT = `${user?.name ?? `用户 #${uid}`} 举报了「${patch.name}」下的评论\n\n评论内容：${comment.content.slice(0, 200)}${metadata}\n\n举报原因：${input.content}`
  const reportLink = (() => {
    if (!patch.unique_id) {
      return ''
    }
    const params = new URLSearchParams()
    params.set('target', 'comment')
    params.set('commentId', String(comment.id))
    params.set('reportedUid', String(comment.user_id))
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
