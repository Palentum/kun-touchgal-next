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

const MOEMOEPOINT_REQUIRED = 20
const MOEMOEPOINT_COST = 10

export const checkConversation = async (
  input: z.infer<typeof createConversationSchema>,
  uid: number,
  role: number
) => {
  const { targetUserId } = input

  if (targetUserId === uid) {
    return { error: '不能和自己创建会话' }
  }

  const [currentUser, targetUser] = await Promise.all([
    prisma.user.findUnique({
      where: { id: uid },
      select: { moemoepoint: true }
    }),
    prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, name: true }
    })
  ])

  if (!currentUser) {
    return { error: '用户不存在' }
  }
  if (!targetUser) {
    return { error: '目标用户不存在' }
  }

  const [userAId, userBId] =
    uid < targetUserId ? [uid, targetUserId] : [targetUserId, uid]

  const conversation = await prisma.user_conversation.findUnique({
    where: {
      user_a_id_user_b_id: { user_a_id: userAId, user_b_id: userBId }
    }
  })

  if (conversation) {
    return {
      exists: true,
      conversationId: conversation.id,
      needsPayment: false,
      targetUserName: targetUser.name
    }
  }

  const isPrivileged = role > 2
  const hasEnoughPoints = currentUser.moemoepoint >= MOEMOEPOINT_REQUIRED

  if (!isPrivileged && !hasEnoughPoints) {
    return {
      error: `萌萌点不足，发起私聊需要至少 ${MOEMOEPOINT_REQUIRED} 萌萌点`
    }
  }

  return {
    exists: false,
    needsPayment: !isPrivileged,
    cost: MOEMOEPOINT_COST,
    currentPoints: currentUser.moemoepoint,
    targetUserName: targetUser.name
  }
}

export const getOrCreateConversation = async (
  input: z.infer<typeof createConversationSchema>,
  uid: number,
  role: number
) => {
  const { targetUserId } = input

  if (targetUserId === uid) {
    return '不能和自己创建会话'
  }

  const [currentUser, targetUser] = await Promise.all([
    prisma.user.findUnique({
      where: { id: uid },
      select: { moemoepoint: true }
    }),
    prisma.user.findUnique({
      where: { id: targetUserId }
    })
  ])

  if (!currentUser) {
    return '用户不存在'
  }
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
  const isPrivileged = role > 2

  if (!conversation) {
    if (!isPrivileged) {
      if (currentUser.moemoepoint < MOEMOEPOINT_REQUIRED) {
        return `萌萌点不足，发起私聊需要至少 ${MOEMOEPOINT_REQUIRED} 萌萌点`
      }

      if (currentUser.moemoepoint < MOEMOEPOINT_COST) {
        return `萌萌点不足，开启新私聊需要消耗 ${MOEMOEPOINT_COST} 萌萌点`
      }

      conversation = await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: uid },
          data: { moemoepoint: { decrement: MOEMOEPOINT_COST } }
        })

        return tx.user_conversation.create({
          data: { user_a_id: userAId, user_b_id: userBId }
        })
      })
    } else {
      conversation = await prisma.user_conversation.create({
        data: { user_a_id: userAId, user_b_id: userBId }
      })
    }
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

  const response = await getOrCreateConversation(input, payload.uid, payload.role)
  return NextResponse.json(response)
}
