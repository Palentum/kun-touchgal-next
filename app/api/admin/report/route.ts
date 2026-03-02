import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { kunParseGetQuery } from '~/app/api/utils/parseQuery'
import { prisma } from '~/prisma/index'
import { adminPaginationSchema } from '~/validations/admin'
import { verifyHeaderCookie } from '~/middleware/_verifyHeaderCookie'
import type { AdminReport } from '~/types/api/admin'

const parseReportMeta = async (content: string, link: string) => {
  const commentMatch = content.match(/举报评论ID:\s*(\d+)/)
  const userMatch = content.match(/被举报用户ID:\s*(\d+)/)
  const parsedCommentId = commentMatch ? Number(commentMatch[1]) : undefined
  const parsedUserId = userMatch ? Number(userMatch[1]) : undefined
  let reportedCommentId =
    parsedCommentId && parsedCommentId > 0 ? parsedCommentId : undefined
  let reportedUserId =
    parsedUserId && parsedUserId > 0 ? parsedUserId : undefined

  if (reportedCommentId || reportedUserId) {
    return { reportedCommentId, reportedUserId }
  }

  let patchUniqueId = ''
  try {
    const url = new URL(link, 'https://touchgal.local')
    const commentId = url.searchParams.get('commentId')
    const reportedUid = url.searchParams.get('reportedUid')
    patchUniqueId = url.pathname.replace(/^\//, '')
    reportedCommentId =
      commentId && Number(commentId) > 0 ? Number(commentId) : undefined
    reportedUserId =
      reportedUid && Number(reportedUid) > 0 ? Number(reportedUid) : undefined
  } catch {
    patchUniqueId = ''
  }

  if (reportedCommentId || reportedUserId) {
    return { reportedCommentId, reportedUserId }
  }

  const commentPreviewMatch = content.match(
    /评论内容:\s*([\s\S]*?)(?:\n举报评论ID:|\n\n举报原因:|$)/
  )
  const commentPreview = commentPreviewMatch?.[1]?.trim()
  if (!patchUniqueId || !commentPreview) {
    return { reportedCommentId: undefined, reportedUserId: undefined }
  }

  const patch = await prisma.patch.findUnique({
    where: { unique_id: patchUniqueId },
    select: { id: true }
  })
  if (!patch) {
    return { reportedCommentId: undefined, reportedUserId: undefined }
  }

  const matchedComment = await prisma.patch_comment.findFirst({
    where: {
      patch_id: patch.id,
      content: {
        startsWith: commentPreview.slice(0, 200)
      }
    },
    select: {
      id: true,
      user_id: true
    }
  })
  if (!matchedComment) {
    return { reportedCommentId: undefined, reportedUserId: undefined }
  }

  return {
    reportedCommentId: matchedComment.id,
    reportedUserId: matchedComment.user_id
  }
}

export const getReport = async (
  input: z.infer<typeof adminPaginationSchema>
) => {
  const { page, limit } = input
  const offset = (page - 1) * limit

  const [data, total] = await Promise.all([
    prisma.user_message.findMany({
      where: { type: 'report', sender_id: { not: null } },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      },
      orderBy: { created: 'desc' },
      skip: offset,
      take: limit
    }),
    prisma.user_message.count({
      where: { type: 'report', sender_id: { not: null } }
    })
  ])

  const reports: AdminReport[] = await Promise.all(
    data.map(async (msg) => {
      const meta = await parseReportMeta(msg.content, msg.link)
      return {
        id: msg.id,
        type: msg.type,
        content: msg.content,
        status: msg.status,
        link: msg.link,
        created: msg.created,
        sender: msg.sender,
        reportedCommentId: meta.reportedCommentId,
        reportedUserId: meta.reportedUserId
      }
    })
  )

  return { reports, total }
}

export const GET = async (req: NextRequest) => {
  const input = kunParseGetQuery(req, adminPaginationSchema)
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

  const response = await getReport(input)
  return NextResponse.json(response)
}
