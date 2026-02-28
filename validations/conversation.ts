import { z } from 'zod'

export const createConversationSchema = z.object({
  targetUserId: z.coerce.number().min(1).max(9999999)
})

export const getConversationsSchema = z.object({
  page: z.coerce.number().min(1).max(9999999),
  limit: z.coerce.number().min(1).max(30)
})

export const getConversationMessagesSchema = z.object({
  page: z.coerce.number().min(1).max(9999999),
  limit: z.coerce.number().min(1).max(50)
})

export const sendPrivateMessageSchema = z.object({
  content: z
    .string()
    .min(1, { message: '消息内容不能为空' })
    .max(2000, { message: '消息内容最多 2000 个字符' })
})
