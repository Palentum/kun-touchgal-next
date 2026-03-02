import { prisma } from '~/prisma/index'
import { MAX_PENDING_REPORTS_TO_SCAN } from '~/config/admin'

interface BaseReportMeta {
  reportedCommentId?: number
  reportedUserId?: number
  patchUniqueId?: string
  commentPreview?: string
}

const parsePositiveNumber = (value?: string | null) => {
  if (!value) {
    return undefined
  }
  const parsedValue = Number(value)
  return parsedValue > 0 ? parsedValue : undefined
}

const parseReportMetaBase = (content: string, link: string): BaseReportMeta => {
  const commentMatch = content.match(/举报评论ID:\s*(\d+)/)
  const userMatch = content.match(/被举报用户ID:\s*(\d+)/)

  let reportedCommentId = parsePositiveNumber(commentMatch?.[1])
  let reportedUserId = parsePositiveNumber(userMatch?.[1])
  let patchUniqueId = ''

  try {
    const url = new URL(link, 'https://touchgal.local')
    patchUniqueId = url.pathname.replace(/^\//, '')
    if (!reportedCommentId) {
      reportedCommentId = parsePositiveNumber(url.searchParams.get('commentId'))
    }
    if (!reportedUserId) {
      reportedUserId = parsePositiveNumber(url.searchParams.get('reportedUid'))
    }
  } catch {
    patchUniqueId = ''
  }

  const commentPreviewMatch = content.match(
    /评论内容:\s*([\s\S]*?)(?:\n举报评论ID:|\n\n举报原因:|$)/
  )
  const commentPreview = commentPreviewMatch?.[1]?.trim()

  return {
    reportedCommentId,
    reportedUserId,
    patchUniqueId,
    commentPreview
  }
}

export const parseReportMetaFast = (content: string, link: string) => {
  const meta = parseReportMetaBase(content, link)
  return {
    reportedCommentId: meta.reportedCommentId,
    reportedUserId: meta.reportedUserId
  }
}

export const resolveReportMeta = async (content: string, link: string) => {
  const baseMeta = parseReportMetaBase(content, link)
  if (baseMeta.reportedCommentId || baseMeta.reportedUserId) {
    if (baseMeta.reportedCommentId && !baseMeta.reportedUserId) {
      const matchedComment = await prisma.patch_comment.findUnique({
        where: { id: baseMeta.reportedCommentId },
        select: { user_id: true }
      })
      if (matchedComment?.user_id) {
        return {
          reportedCommentId: baseMeta.reportedCommentId,
          reportedUserId: matchedComment.user_id
        }
      }
    }

    return {
      reportedCommentId: baseMeta.reportedCommentId,
      reportedUserId: baseMeta.reportedUserId
    }
  }

  if (!baseMeta.patchUniqueId || !baseMeta.commentPreview) {
    return { reportedCommentId: undefined, reportedUserId: undefined }
  }

  const patch = await prisma.patch.findUnique({
    where: { unique_id: baseMeta.patchUniqueId },
    select: { id: true }
  })
  if (!patch) {
    return { reportedCommentId: undefined, reportedUserId: undefined }
  }

  const matchedComment = await prisma.patch_comment.findFirst({
    where: {
      patch_id: patch.id,
      content: {
        startsWith: baseMeta.commentPreview.slice(0, 200)
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

export const findRelatedReportIds = async (
  targetCommentId: number,
  excludeMessageId: number
): Promise<number[]> => {
  const pendingReports = await prisma.user_message.findMany({
    where: {
      type: 'report',
      status: 0,
      sender_id: { not: null },
      id: { not: excludeMessageId }
    },
    select: {
      id: true,
      content: true,
      link: true
    },
    take: MAX_PENDING_REPORTS_TO_SCAN
  })

  const relatedIds: number[] = []

  for (const report of pendingReports) {
    const fastMeta = parseReportMetaFast(report.content, report.link)

    if (fastMeta.reportedCommentId === targetCommentId) {
      relatedIds.push(report.id)
      continue
    }

    if (fastMeta.reportedCommentId) {
      continue
    }

    const meta = await resolveReportMeta(report.content, report.link)
    if (meta.reportedCommentId === targetCommentId) {
      relatedIds.push(report.id)
    }
  }

  return relatedIds
}
