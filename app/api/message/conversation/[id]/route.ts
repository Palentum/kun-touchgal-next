import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { kunParseGetQuery, kunParsePostBody } from '~/app/api/utils/parseQuery'
import { prisma } from '~/prisma/index'
import {
  getConversationMessagesSchema,
  sendPrivateMessageSchema,
  updatePrivateMessageSchema,
  deletePrivateMessageSchema
} from '~/validations/conversation'
import { verifyHeaderCookie } from '~/middleware/_verifyHeaderCookie'
import type { PrivateMessage } from '~/types/api/conversation'

const verifyConversationAccess = async (
  conversationId: number,
  uid: number
) => {
  const conversation = await prisma.user_conversation.findUnique({
    where: { id: conversationId },
    include: {
      user_a: { select: { id: true, name: true, avatar: true } },
      user_b: { select: { id: true, name: true, avatar: true } }
    }
  })

  if (!conversation) {
    return null
  }

  if (conversation.user_a_id !== uid && conversation.user_b_id !== uid) {
    return null
  }

  return conversation
}

export const getConversationMessages = async (
  conversationId: number,
  input: z.infer<typeof getConversationMessagesSchema>,
  uid: number
) => {
  const conversation = await verifyConversationAccess(conversationId, uid)
  if (!conversation) {
    return '会话不存在或无权访问'
  }

  const { page, limit } = input
  const offset = (page - 1) * limit

  const [data, total] = await Promise.all([
    prisma.user_private_message.findMany({
      where: { conversation_id: conversationId },
      include: {
        sender: {
          select: { id: true, name: true, avatar: true }
        }
      },
      orderBy: { created: 'desc' },
      skip: offset,
      take: limit
    }),
    prisma.user_private_message.count({
      where: { conversation_id: conversationId }
    })
  ])

  const messages: PrivateMessage[] = data.map((msg) => ({
    id: msg.id,
    content: msg.content,
    status: msg.status,
    isDeleted: msg.is_deleted,
    editedAt: msg.edited_at,
    created: msg.created,
    sender: msg.sender
  }))

  const otherUser =
    conversation.user_a_id === uid ? conversation.user_b : conversation.user_a

  return { messages, total, otherUser }
}

export const sendMessage = async (
  conversationId: number,
  input: z.infer<typeof sendPrivateMessageSchema>,
  uid: number
) => {
  const conversation = await verifyConversationAccess(conversationId, uid)
  if (!conversation) {
    return '会话不存在或无权访问'
  }

  const { content } = input

  const message = await prisma.user_private_message.create({
    data: {
      conversation_id: conversationId,
      sender_id: uid,
      content
    }
  })

  const isUserA = conversation.user_a_id === uid
  await prisma.user_conversation.update({
    where: { id: conversationId },
    data: {
      last_message_id: message.id,
      last_message_time: message.created,
      ...(isUserA
        ? { user_b_unread_count: { increment: 1 } }
        : { user_a_unread_count: { increment: 1 } })
    }
  })

  return {
    id: message.id,
    content: message.content,
    created: message.created
  }
}

export const updateMessage = async (
  conversationId: number,
  input: z.infer<typeof updatePrivateMessageSchema>,
  uid: number
) => {
  const conversation = await verifyConversationAccess(conversationId, uid)
  if (!conversation) {
    return '会话不存在或无权访问'
  }

  const { messageId, content } = input

  const message = await prisma.user_private_message.findUnique({
    where: { id: messageId }
  })

  if (!message) {
    return '消息不存在'
  }

  if (message.sender_id !== uid) {
    return '只能编辑自己的消息'
  }

  if (message.is_deleted) {
    return '无法编辑已删除的消息'
  }

  const updated = await prisma.user_private_message.update({
    where: { id: messageId },
    data: {
      content,
      edited_at: new Date()
    }
  })

  return {
    id: updated.id,
    content: updated.content,
    editedAt: updated.edited_at
  }
}

export const deleteMessage = async (
  conversationId: number,
  input: z.infer<typeof deletePrivateMessageSchema>,
  uid: number
) => {
  const conversation = await verifyConversationAccess(conversationId, uid)
  if (!conversation) {
    return '会话不存在或无权访问'
  }

  const { messageId } = input

  const message = await prisma.user_private_message.findUnique({
    where: { id: messageId }
  })

  if (!message) {
    return '消息不存在'
  }

  if (message.sender_id !== uid) {
    return '只能删除自己的消息'
  }

  await prisma.user_private_message.update({
    where: { id: messageId },
    data: { is_deleted: true }
  })

  return {}
}

export const GET = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const conversationId = parseInt(id, 10)
  if (isNaN(conversationId)) {
    return NextResponse.json('无效的会话 ID')
  }

  const input = kunParseGetQuery(req, getConversationMessagesSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }

  const payload = await verifyHeaderCookie(req)
  if (!payload) {
    return NextResponse.json('用户未登录')
  }

  const response = await getConversationMessages(
    conversationId,
    input,
    payload.uid
  )
  return NextResponse.json(response)
}

export const POST = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const conversationId = parseInt(id, 10)
  if (isNaN(conversationId)) {
    return NextResponse.json('无效的会话 ID')
  }

  const input = await kunParsePostBody(req, sendPrivateMessageSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }

  const payload = await verifyHeaderCookie(req)
  if (!payload) {
    return NextResponse.json('用户未登录')
  }

  const response = await sendMessage(conversationId, input, payload.uid)
  return NextResponse.json(response)
}

export const PUT = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const conversationId = parseInt(id, 10)
  if (isNaN(conversationId)) {
    return NextResponse.json('无效的会话 ID')
  }

  const input = await kunParsePostBody(req, updatePrivateMessageSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }

  const payload = await verifyHeaderCookie(req)
  if (!payload) {
    return NextResponse.json('用户未登录')
  }

  const response = await updateMessage(conversationId, input, payload.uid)
  return NextResponse.json(response)
}

export const DELETE = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const conversationId = parseInt(id, 10)
  if (isNaN(conversationId)) {
    return NextResponse.json('无效的会话 ID')
  }

  const input = kunParseGetQuery(req, deletePrivateMessageSchema)
  if (typeof input === 'string') {
    return NextResponse.json(input)
  }

  const payload = await verifyHeaderCookie(req)
  if (!payload) {
    return NextResponse.json('用户未登录')
  }

  const response = await deleteMessage(conversationId, input, payload.uid)
  return NextResponse.json(response)
}
