import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { kunParsePostBody } from '~/app/api/utils/parseQuery'
import { prisma } from '~/prisma/index'
import { adminHandleReportSchema } from '~/validations/admin'
import { verifyHeaderCookie } from '~/middleware/_verifyHeaderCookie'
import { sliceUntilDelimiterFromEnd } from '~/app/api/utils/sliceUntilDelimiterFromEnd'
import { createMessage } from '~/app/api/utils/message'

const resolveReportedCommentId = async (content: string, link: string) => {
  const commentMatch = content.match(/举报评论ID:\s*(\d+)/)
  if (commentMatch?.[1]) {
    const commentId = Number(commentMatch[1])
    return commentId > 0 ? commentId : undefined
  }

  let patchUniqueId = ''
  try {
    const url = new URL(link, 'https://touchgal.local')
    patchUniqueId = url.pathname.replace(/^\//, '')
    const commentId = url.searchParams.get('commentId')
    if (commentId) {
      const parsedCommentId = Number(commentId)
      if (parsedCommentId > 0) {
        return parsedCommentId
      }
    }
  } catch {
    patchUniqueId = ''
  }

  const commentPreviewMatch = content.match(
    /评论内容:\s*([\s\S]*?)(?:\n举报评论ID:|\n\n举报原因:|$)/
  )
  const commentPreview = commentPreviewMatch?.[1]?.trim()
  if (!patchUniqueId || !commentPreview) {
    return undefined
  }

  const patch = await prisma.patch.findUnique({
    where: { unique_id: patchUniqueId },
    select: { id: true }
  })
  if (!patch) {
    return undefined
  }

  const matchedComment = await prisma.patch_comment.findFirst({
    where: {
      patch_id: patch.id,
      content: { startsWith: commentPreview.slice(0, 200) }
    },
    select: { id: true }
  })
  return matchedComment?.id
}

export const handleReport = async (
  input: z.infer<typeof adminHandleReportSchema>
) => {
  const message = await prisma.user_message.findUnique({
    where: { id: input.messageId }
  })
  if (!message) {
    return '该举报不存在'
  }
  if (message?.status) {
    return '该举报已被处理'
  }

  const targetCommentId =
    input.commentId ?? (await resolveReportedCommentId(message.content, message.link))
  if (input.action === 'delete') {
    if (!targetCommentId) {
      return '无法定位被举报评论'
    }
    const comment = await prisma.patch_comment.findUnique({
      where: { id: targetCommentId },
      select: { id: true }
    })
    if (!comment) {
      return '被举报评论不存在或已删除'
    }
  }

  const SLICED_CONTENT = sliceUntilDelimiterFromEnd(message.content).slice(0, 200)
  const defaultReply = input.action === 'reject' ? '已驳回' : '已处理'
  const handleResult = input.content ? input.content : defaultReply
  const reportStatus = input.action === 'reject' ? 3 : 2
  const reportResult =
    input.action === 'reject' ? '您的举报已驳回!' : '您的举报已处理!'
  const reportReplyLabel =
    input.action === 'reject' ? '举报驳回回复' : '举报处理回复'
  const reportContent = `${reportResult}\n\n举报原因: ${SLICED_CONTENT}\n${reportReplyLabel}: ${handleResult}`

  return prisma.$transaction(async (prisma) => {
    if (input.action === 'delete' && targetCommentId) {
      await prisma.patch_comment.delete({
        where: { id: targetCommentId }
      })
    }

    await prisma.user_message.update({
      where: { id: input.messageId },
      // status: 0 - unread, 1 - read, 2 - approve, 3 - decline
      data: { status: { set: reportStatus } }
    })

    await createMessage({
      type: 'report',
      content: reportContent,
      recipient_id: message.sender_id ?? undefined,
      link: '/'
    })

    return {}
  })
}

export const POST = async (req: NextRequest) => {
  const input = await kunParsePostBody(req, adminHandleReportSchema)
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

  const response = await handleReport(input)
  return NextResponse.json(response)
}
