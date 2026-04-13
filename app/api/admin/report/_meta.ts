import { prisma } from '~/prisma/index'
import { MAX_PENDING_REPORTS_TO_SCAN } from '~/config/admin'
import type { AdminReportTargetType } from '~/types/api/admin'

interface BaseReportMeta {
  targetType?: AdminReportTargetType
  reportedCommentId?: number
  reportedRatingId?: number
  reportedUserId?: number
  patchUniqueId?: string
  targetPreview?: string
}

const getEmptyReportMeta = () => ({
  targetType: undefined,
  reportedCommentId: undefined,
  reportedRatingId: undefined,
  reportedUserId: undefined
})

const REPORT_TARGET_MATCHERS: Record<AdminReportTargetType, string[]> = {
  comment: ['举报评论ID:', 'commentId=', '评论内容:', 'target=comment'],
  rating: ['举报评价ID:', 'ratingId=', '评价内容:', 'target=rating']
}

export const getReportTargetWhere = (targetType: AdminReportTargetType) => ({
  OR: REPORT_TARGET_MATCHERS[targetType].map((pattern) => ({
    OR: [{ content: { contains: pattern } }, { link: { contains: pattern } }]
  }))
})

const parsePositiveNumber = (value?: string | null) => {
  if (!value) {
    return undefined
  }
  const parsedValue = Number(value)
  return parsedValue > 0 ? parsedValue : undefined
}

const parseReportMetaBase = (content: string, link: string): BaseReportMeta => {
  const commentMatch = content.match(/举报评论ID:\s*(\d+)/)
  const ratingMatch = content.match(/举报评价ID:\s*(\d+)/)
  const userMatch = content.match(/被举报用户ID:\s*(\d+)/)

  let targetType: AdminReportTargetType | undefined = ratingMatch
    ? 'rating'
    : commentMatch
      ? 'comment'
      : content.includes('评价内容:')
        ? 'rating'
        : content.includes('评论内容:')
          ? 'comment'
          : undefined
  let reportedCommentId = parsePositiveNumber(commentMatch?.[1])
  let reportedRatingId = parsePositiveNumber(ratingMatch?.[1])
  let reportedUserId = parsePositiveNumber(userMatch?.[1])
  let patchUniqueId = ''

  try {
    const url = new URL(link, 'https://touchgal.local')
    patchUniqueId = url.pathname.replace(/^\//, '')
    const queryTargetType = url.searchParams.get('target')
    if (queryTargetType === 'comment' || queryTargetType === 'rating') {
      targetType = queryTargetType
    }
    if (!reportedCommentId) {
      reportedCommentId = parsePositiveNumber(url.searchParams.get('commentId'))
    }
    if (!reportedRatingId) {
      reportedRatingId = parsePositiveNumber(url.searchParams.get('ratingId'))
    }
    if (!reportedUserId) {
      reportedUserId = parsePositiveNumber(url.searchParams.get('reportedUid'))
    }
  } catch {
    patchUniqueId = ''
  }

  const targetPreviewMatch =
    targetType === 'rating'
      ? content.match(/评价内容:\s*([\s\S]*?)(?:\n举报评价ID:|\n\n举报原因:|$)/)
      : content.match(/评论内容:\s*([\s\S]*?)(?:\n举报评论ID:|\n\n举报原因:|$)/)
  const targetPreview = targetPreviewMatch?.[1]?.trim()

  if (!targetType) {
    if (reportedRatingId) {
      targetType = 'rating'
    } else if (reportedCommentId) {
      targetType = 'comment'
    }
  }

  return {
    targetType,
    reportedCommentId,
    reportedRatingId,
    reportedUserId,
    patchUniqueId,
    targetPreview
  }
}

export const parseReportMetaFast = (content: string, link: string) => {
  const meta = parseReportMetaBase(content, link)
  return {
    targetType: meta.targetType,
    reportedCommentId: meta.reportedCommentId,
    reportedRatingId: meta.reportedRatingId,
    reportedUserId: meta.reportedUserId
  }
}

const findReportedUserIdByTarget = async (
  targetType: AdminReportTargetType,
  targetId: number
) => {
  if (targetType === 'comment') {
    const matchedComment = await prisma.patch_comment.findUnique({
      where: { id: targetId },
      select: { user_id: true }
    })
    return matchedComment?.user_id
  }

  const matchedRating = await prisma.patch_rating.findUnique({
    where: { id: targetId },
    select: { user_id: true }
  })
  return matchedRating?.user_id
}

export const resolveReportMeta = async (content: string, link: string) => {
  const baseMeta = parseReportMetaBase(content, link)

  const targetId =
    baseMeta.targetType === 'rating'
      ? baseMeta.reportedRatingId
      : baseMeta.reportedCommentId

  if (baseMeta.targetType && targetId) {
    const reportedUserId = await findReportedUserIdByTarget(
      baseMeta.targetType,
      targetId
    )
    if (!reportedUserId) {
      return getEmptyReportMeta()
    }

    return {
      targetType: baseMeta.targetType,
      reportedCommentId: baseMeta.reportedCommentId,
      reportedRatingId: baseMeta.reportedRatingId,
      reportedUserId
    }
  }

  if (
    !baseMeta.patchUniqueId ||
    !baseMeta.targetPreview ||
    !baseMeta.targetType
  ) {
    return getEmptyReportMeta()
  }

  const patch = await prisma.patch.findUnique({
    where: { unique_id: baseMeta.patchUniqueId },
    select: { id: true }
  })
  if (!patch) {
    return getEmptyReportMeta()
  }

  if (baseMeta.targetType === 'comment') {
    const matchedComment = await prisma.patch_comment.findFirst({
      where: {
        patch_id: patch.id,
        content: {
          startsWith: baseMeta.targetPreview.slice(0, 200)
        }
      },
      select: {
        id: true,
        user_id: true
      }
    })
    if (!matchedComment) {
      return getEmptyReportMeta()
    }

    return {
      targetType: 'comment',
      reportedCommentId: matchedComment.id,
      reportedRatingId: undefined,
      reportedUserId: matchedComment.user_id
    }
  }

  const previewText = baseMeta.targetPreview.slice(0, 200)
  const isGeneratedPreview = previewText.startsWith('总分 ')

  if (isGeneratedPreview) {
    return getEmptyReportMeta()
  }

  const matchedRating = await prisma.patch_rating.findFirst({
    where: {
      patch_id: patch.id,
      short_summary: {
        startsWith: previewText
      }
    },
    select: {
      id: true,
      user_id: true
    }
  })
  if (!matchedRating) {
    return getEmptyReportMeta()
  }

  return {
    targetType: 'rating',
    reportedCommentId: undefined,
    reportedRatingId: matchedRating.id,
    reportedUserId: matchedRating.user_id
  }
}

export const findRelatedReportIds = async (
  targetType: AdminReportTargetType,
  targetId: number,
  excludeMessageId: number
): Promise<number[]> => {
  const pendingReports = await prisma.user_message.findMany({
    where: {
      type: 'report',
      status: 0,
      sender_id: { not: null },
      recipient_id: null,
      id: { not: excludeMessageId },
      ...getReportTargetWhere(targetType)
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

    if (targetType === 'comment' && fastMeta.reportedCommentId === targetId) {
      relatedIds.push(report.id)
      continue
    }
    if (targetType === 'rating' && fastMeta.reportedRatingId === targetId) {
      relatedIds.push(report.id)
      continue
    }

    if (
      (targetType === 'comment' && fastMeta.reportedCommentId) ||
      (targetType === 'rating' && fastMeta.reportedRatingId)
    ) {
      continue
    }

    const meta = await resolveReportMeta(report.content, report.link)
    if (targetType === 'comment' && meta.reportedCommentId === targetId) {
      relatedIds.push(report.id)
    }
    if (targetType === 'rating' && meta.reportedRatingId === targetId) {
      relatedIds.push(report.id)
    }
  }

  return relatedIds
}
