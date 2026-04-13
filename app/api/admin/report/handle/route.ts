import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { kunParsePostBody } from '~/app/api/utils/parseQuery'
import { prisma } from '~/prisma/index'
import { adminHandleReportSchema } from '~/validations/admin'
import { verifyHeaderCookie } from '~/middleware/_verifyHeaderCookie'
import { sliceUntilDelimiterFromEnd } from '~/app/api/utils/sliceUntilDelimiterFromEnd'
import { findRelatedReportIds, resolveReportMeta } from '../_meta'
import { recomputePatchRatingStat } from '~/app/api/patch/rating/stat'
import type { AdminReportTargetType } from '~/types/api/admin'

const isReportTargetType = (value?: string): value is AdminReportTargetType =>
  value === 'comment' || value === 'rating'

const handleReport = async (input: z.infer<typeof adminHandleReportSchema>) => {
  const message = await prisma.user_message.findUnique({
    where: { id: input.messageId }
  })
  if (!message) {
    return '该举报不存在'
  }
  if (
    message.type !== 'report' ||
    !message.sender_id ||
    message.recipient_id !== null
  ) {
    return '该举报无效'
  }
  if (message.status !== 0) {
    return '该举报已被处理'
  }

  const resolvedMeta = await resolveReportMeta(message.content, message.link)
  const targetType: AdminReportTargetType = isReportTargetType(
    resolvedMeta.targetType
  )
    ? resolvedMeta.targetType
    : input.targetType
  const targetId =
    targetType === 'rating'
      ? resolvedMeta.reportedRatingId
      : resolvedMeta.reportedCommentId
  if (input.action === 'delete' && !targetId) {
    return '未找到被举报内容'
  }

  const relatedReportIds =
    input.action === 'delete' && targetId
      ? await findRelatedReportIds(targetType, targetId, input.messageId)
      : []

  const SLICED_CONTENT = sliceUntilDelimiterFromEnd(message.content).slice(
    0,
    200
  )
  const defaultReply = input.action === 'reject' ? '已驳回' : '已处理'
  const handleResult = input.content ? input.content : defaultReply
  const reportStatus = input.action === 'reject' ? 3 : 2
  const reportResult =
    input.action === 'reject' ? '您的举报已驳回' : '您的举报已处理'
  const reportReplyLabel = input.action === 'reject' ? '驳回回复' : '处理回复'
  const reportContent = `${reportResult}\n\n举报原因：${SLICED_CONTENT}\n${reportReplyLabel}：${handleResult}`

  const ratingPatchId =
    input.action === 'delete' && targetType === 'rating' && targetId
      ? (
          await prisma.patch_rating.findUnique({
            where: { id: targetId },
            select: { patch_id: true }
          })
        )?.patch_id
      : undefined

  const response = await prisma.$transaction(async (prisma) => {
    const messageIdsToHandle = [
      ...new Set([input.messageId, ...relatedReportIds])
    ]
    if (input.action === 'delete' && targetId) {
      if (targetType === 'comment') {
        await prisma.patch_comment.deleteMany({
          where: { id: targetId }
        })
      } else {
        await prisma.patch_rating.deleteMany({
          where: { id: targetId }
        })
      }
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

  if (ratingPatchId) {
    await recomputePatchRatingStat(ratingPatchId)
  }

  return response
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
  if (payload.role < 4) {
    return NextResponse.json('本页面仅超级管理员可访问')
  }

  const response = await handleReport(input)
  return NextResponse.json(response)
}
