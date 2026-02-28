import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { kunParseGetQuery, kunParsePostBody } from '~/app/api/utils/parseQuery'
import { prisma } from '~/prisma/index'
import {
  getConversationsSchema,
  createConversationSchema
} from '~/validations/conversation'
import { verifyHeaderCookie } from '~/middleware/_verifyHeaderCookie'
import type { Conversation } from '~/types/api/conversation'

export const getConversations = async (
  input: z.infer<typeof getConversationsSchema>,
  uid: number
) => {
  const { page, limit } = input
  const offset = (page - 1) * limit

  const [data, total] = await Promise.all([
    prisma.user_conversation.findMany({
      where: {
        OR: [{ user_a_id: uid }, { user_b_id: uid }]
      },
      include: {
        user_a: {
          select: { id: true, name: true, avatar: true }
        },
        user_b: {
          select: { id: true, name: true, avatar: true }
        },
        messages: {
          orderBy: { created: 'desc' },
          take: 1,
          select: { content: true }
        }
      },
      orderBy: { last_message_time: 'desc' },
      skip: offset,
      take: limit
    }),
    prisma.user_conversation.count({
      where: {
        OR: [{ user_a_id: uid }, { user_b_id: uid }]
      }
    })
  ])

  const conversations: Conversation[] = data.map((conv) => ({
    id: conv.id,
    otherUser: conv.user_a_id === uid ? conv.user_b : conv.user_a,
    lastMessage: conv.messages[0]?.content || '',
    lastMessageTime: conv.last_message_time,
    unreadCount:
      conv.user_a_id === uid
        ? conv.user_a_unread_count
        : conv.user_b_unread_count
  }))

  return { conversations, total }
}

export const getOrCreateConversation = async (
  input: z.infer<typeof createConversationSchema>,
  uid: number
) => {
  const { targetUserId } = input

  if (targetUserId === uid) {
    return '不能和自己创建会话'
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId }
  })
  if (!targetUser) {
    return '目标用户不存在'
  }

  const [userAId, userBId] =
    uid < targetUserId ? [uid, targetUserId] : [targetUserId, uid]

  let conversation = await prisma.user_conversation.findUnique({
    where: {
      user_a_id_user_b_id: { user_a_id: userAId, user_b_id: userBId }
    }
  })

  const isNew = !conversation

  if (!conversation) {
    conversation = await prisma.user_conversation.create({
      data: { user_a_id: userAId, user_b_id: userBId }
    })
  }

  return { conversationId: conversation.id, isNew }
}

export const GET = async (req: NextRequest) => {
  const input = kunParseGetQuery(req, getConversationsSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }
  const payload = await verifyHeaderCookie(req)
  if (!payload) {
    return NextResponse.json('用户未登录')
  }

  const response = await getConversations(input, payload.uid)
  return NextResponse.json(response)
}

export const POST = async (req: NextRequest) => {
  const input = await kunParsePostBody(req, createConversationSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }
  const payload = await verifyHeaderCookie(req)
  if (!payload) {
    return NextResponse.json('用户未登录')
  }

  const response = await getOrCreateConversation(input, payload.uid)
  return NextResponse.json(response)
}
