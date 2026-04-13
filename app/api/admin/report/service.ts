import { z } from 'zod'
import { prisma } from '~/prisma/index'
import { adminReportPaginationSchema } from '~/validations/admin'
import type { AdminReport, AdminReportTargetType } from '~/types/api/admin'
import { getReportTargetWhere, resolveReportMeta } from './_meta'

export const getReport = async (
  input: z.infer<typeof adminReportPaginationSchema>
) => {
  const { page, limit, tab, targetType } = input
  const offset = (page - 1) * limit
  const where = {
    type: 'report',
    sender_id: { not: null },
    recipient_id: null,
    ...(tab === 'pending' ? { status: 0 } : { status: { in: [2, 3] } }),
    ...getReportTargetWhere(targetType)
  }

  const [data, total] = await Promise.all([
    prisma.user_message.findMany({
      where,
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
    prisma.user_message.count({ where })
  ])

  const reportsWithMeta = await Promise.all(
    data.map(async (msg) => ({
      msg,
      meta: await resolveReportMeta(msg.content, msg.link)
    }))
  )

  const reportedUserIds = [
    ...new Set(
      reportsWithMeta
        .map(({ meta }) => meta.reportedUserId)
        .filter((id): id is number => !!id)
    )
  ]
  const reportedUsers = reportedUserIds.length
    ? await prisma.user.findMany({
        where: { id: { in: reportedUserIds } },
        select: {
          id: true,
          name: true,
          avatar: true
        }
      })
    : []
  const reportedUserMap = new Map(
    reportedUsers.map((user) => [
      user.id,
      { id: user.id, name: user.name, avatar: user.avatar }
    ])
  )

  const reports: AdminReport[] = reportsWithMeta.map(({ msg, meta }) => ({
    id: msg.id,
    type: msg.type,
    content: msg.content,
    status: msg.status,
    link: msg.link,
    created: msg.created,
    sender: msg.sender,
    targetType: (meta.targetType ?? targetType) as AdminReportTargetType,
    reportedCommentId: meta.reportedCommentId,
    reportedRatingId: meta.reportedRatingId,
    reportedUserId: meta.reportedUserId,
    reportedUser: meta.reportedUserId
      ? (reportedUserMap.get(meta.reportedUserId) ?? null)
      : null
  }))

  return { reports, total }
}
