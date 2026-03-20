import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { kunParsePostBody } from '~/app/api/utils/parseQuery'
import { verifyHeaderCookie } from '~/middleware/_verifyHeaderCookie'
import { createPatchRatingReportSchema } from '~/validations/patch'
import { createMessage } from '~/app/api/utils/message'
import { prisma } from '~/prisma'
import {
  KUN_GALGAME_RATING_PLAY_STATUS_MAP,
  KUN_GALGAME_RATING_RECOMMEND_MAP
} from '~/constants/galgame'

export const createReport = async (
  input: z.infer<typeof createPatchRatingReportSchema>,
  uid: number
) => {
  const rating = await prisma.patch_rating.findUnique({
    where: { id: input.ratingId }
  })
  if (!rating) {
    return '评价不存在'
  }
  if (rating.patch_id !== input.patchId) {
    return '评价不属于当前游戏'
  }
  if (rating.user_id === uid) {
    return '不能举报自己的评价'
  }

  const existingReport = await prisma.user_message.findFirst({
    where: {
      type: 'report',
      sender_id: uid,
      status: 0,
      link: { contains: `ratingId=${input.ratingId}` }
    },
    select: { id: true }
  })
  if (existingReport) {
    return '您已经举报过该评价，请等待管理员处理'
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

  const preview = rating.short_summary.trim()
    ? rating.short_summary.trim().slice(0, 200)
    : `总分 ${rating.overall}/10，${KUN_GALGAME_RATING_RECOMMEND_MAP[rating.recommend]}，${KUN_GALGAME_RATING_PLAY_STATUS_MAP[rating.play_status]}`
  const metadata = `\n举报评价ID: ${rating.id}\n被举报用户ID: ${rating.user_id}`
  const content = `用户: ${user?.name ?? `用户 #${uid}`} 举报了游戏 ${patch.name} 下的评价\n\n评价内容: ${preview}${metadata}\n\n举报原因: ${input.content}`

  const params = new URLSearchParams({
    target: 'rating',
    ratingId: String(rating.id),
    reportedUid: String(rating.user_id)
  })

  await createMessage({
    type: 'report',
    content,
    sender_id: uid,
    link: `/${patch.unique_id}?${params.toString()}`
  })

  return {}
}

export const POST = async (req: NextRequest) => {
  const input = await kunParsePostBody(req, createPatchRatingReportSchema)
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
