import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { kunParseGetQuery } from '~/app/api/utils/parseQuery'
import { prisma } from '~/prisma/index'
import { getUserInfoSchema } from '~/validations/user'
import { verifyHeaderCookie } from '~/middleware/_verifyHeaderCookie'
import type { UserRating } from '~/types/api/user'

export const getUserPatchRating = async (
  input: z.infer<typeof getUserInfoSchema>
) => {
  const { uid, page, limit } = input
  const offset = (page - 1) * limit

  const [data, total] = await Promise.all([
    prisma.patch_rating.findMany({
      where: { user_id: uid },
      include: {
        patch: {
          select: {
            name: true,
            unique_id: true
          }
        },
        _count: {
          select: {
            like: true
          }
        }
      },
      orderBy: { created: 'desc' },
      skip: offset,
      take: limit
    }),
    prisma.patch_rating.count({
      where: { user_id: uid }
    })
  ])

  const ratings: UserRating[] = data.map((rating) => ({
    id: rating.id,
    patchUniqueId: rating.patch.unique_id,
    patchName: rating.patch.name,
    recommend: rating.recommend,
    overall: rating.overall,
    playStatus: rating.play_status,
    shortSummary: rating.short_summary,
    spoilerLevel: rating.spoiler_level,
    like: rating._count.like,
    created: String(rating.created)
  }))

  return { ratings, total }
}

export const GET = async (req: NextRequest) => {
  const input = kunParseGetQuery(req, getUserInfoSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }
  const payload = await verifyHeaderCookie(req)
  if (!payload) {
    return NextResponse.json('用户登陆失效')
  }

  const response = await getUserPatchRating(input)
  return NextResponse.json(response)
}
