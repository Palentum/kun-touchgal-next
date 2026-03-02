import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { kunParsePostBody } from '~/app/api/utils/parseQuery'
import { prisma } from '~/prisma/index'
import { adminHandleReportSchema } from '~/validations/admin'
import { verifyHeaderCookie } from '~/middleware/_verifyHeaderCookie'
import { sliceUntilDelimiterFromEnd } from '~/app/api/utils/sliceUntilDelimiterFromEnd'
import { parseReportMetaFast, resolveReportMeta } from '../_meta'

export const handleReport = async (
  input: z.infer<typeof adminHandleReportSchema>
) => {
  const message = await prisma.user_message.findUnique({
    where: { id: input.messageId }
  })
  if (!message) {
    return '该举报不存在'
  }
  if (message.status !== 0) {
    return '该举报已被处理'
  }

  const targetCommentId = input.commentId
    ? input.commentId
    : (await resolveReportMeta(message.content, message.link)).reportedCommentId
  const relatedReportIds =
    input.action === 'delete' && targetCommentId
      ? (
          await Promise.all(
            (
              await prisma.user_message.findMany({
                where: {
                  type: 'report',
                  status: 0,
                  sender_id: { not: null }
                },
                select: {
                  id: true,
                  content: true,
                  link: true
                }
              })
            ).map(async (report) => {
              if (report.id === input.messageId) {
                return undefined
              }

              const fastMeta = parseReportMetaFast(report.content, report.link)
              if (fastMeta.reportedCommentId === targetCommentId) {
                return report.id
              }
              if (fastMeta.reportedCommentId) {
                return undefined
              }

              const meta = await resolveReportMeta(report.content, report.link)
              return meta.reportedCommentId === targetCommentId
                ? report.id
                : undefined
            })
          )
        ).filter((id): id is number => !!id)
      : []

  const SLICED_CONTENT = sliceUntilDelimiterFromEnd(message.content).slice(
    0,
    200
  )
  const defaultReply = input.action === 'reject' ? '已驳回' : '已处理'
  const handleResult = input.content ? input.content : defaultReply
  const reportStatus = input.action === 'reject' ? 3 : 2
  const reportResult =
    input.action === 'reject' ? '您的举报已驳回!' : '您的举报已处理!'
  const reportReplyLabel =
    input.action === 'reject' ? '举报驳回回复' : '举报处理回复'
  const reportContent = `${reportResult}\n\n举报原因: ${SLICED_CONTENT}\n${reportReplyLabel}: ${handleResult}`

  return prisma.$transaction(async (prisma) => {
    const messageIdsToHandle = [...new Set([input.messageId, ...relatedReportIds])]
    if (input.action === 'delete' && targetCommentId) {
      await prisma.patch_comment.deleteMany({
        where: { id: targetCommentId }
      })
    }

    const affectedReports = await prisma.user_message.findMany({
      where: {
        id: {
          in: messageIdsToHandle
        }
      },
      select: {
        sender_id: true
      }
    })

    await prisma.user_message.updateMany({
      where: {
        id: {
          in: messageIdsToHandle
        }
      },
      // status: 0 - unread, 1 - read, 2 - approve, 3 - decline
      data: { status: { set: reportStatus } }
    })

    const recipientIds = [
      ...new Set(
        affectedReports
          .map((report) => report.sender_id)
          .filter((id): id is number => !!id)
      )
    ]
    if (recipientIds.length) {
      await prisma.user_message.createMany({
        data: recipientIds.map((recipientId) => ({
          type: 'report',
          content: reportContent,
          recipient_id: recipientId,
          link: '/'
        }))
      })
    }

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
