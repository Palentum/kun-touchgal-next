import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '~/prisma/index'
import { verifyHeaderCookie } from '~/middleware/_verifyHeaderCookie'

export const getMessage = async (uid: number) => {
  const [unreadNotification, unreadConversation] = await Promise.all([
    prisma.user_message.findFirst({
      where: { recipient_id: uid, status: 0 }
    }),
    prisma.user_conversation.findFirst({
      where: {
        OR: [
          { user_a_id: uid, user_a_unread_count: { gt: 0 } },
          { user_b_id: uid, user_b_unread_count: { gt: 0 } }
        ]
      }
    })
  ])
  return unreadNotification || unreadConversation
}

export const GET = async (req: NextRequest) => {
  const payload = await verifyHeaderCookie(req)
  if (!payload) {
    return NextResponse.json('用户未登录')
  }

  const response = await getMessage(payload.uid)
  return NextResponse.json(response)
}
