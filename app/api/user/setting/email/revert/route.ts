import { NextRequest } from 'next/server'
import { prisma } from '~/prisma/index'
import { delKv, getKv } from '~/lib/redis'
import {
  createEmailChangeRevertConfirmResponse,
  createEmailChangeRevertKey,
  createEmailChangeRevertResponse,
  type EmailChangeRevertPayload
} from '../_emailChange'

const parseRevertPayload = (
  value: string | null
): EmailChangeRevertPayload | null => {
  if (!value) {
    return null
  }

  try {
    const payload = JSON.parse(value) as EmailChangeRevertPayload
    if (
      typeof payload.uid !== 'number' ||
      typeof payload.oldEmail !== 'string' ||
      typeof payload.newEmail !== 'string' ||
      typeof payload.createdAt !== 'string'
    ) {
      return null
    }

    return payload
  } catch {
    return null
  }
}

const getTokenFromBody = async (req: NextRequest) => {
  const contentType = req.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    const body = await req.json().catch(() => null)
    return typeof body?.token === 'string' ? body.token.trim() : ''
  }

  const formData = await req.formData().catch(() => null)
  const token = formData?.get('token')
  return typeof token === 'string' ? token.trim() : ''
}

const getRevertPayload = async (token: string) => {
  const revertKey = createEmailChangeRevertKey(token)
  const payload = parseRevertPayload(await getKv(revertKey))
  return { payload, revertKey }
}

export const GET = async (req: NextRequest) => {
  const token = new URL(req.url).searchParams.get('token')?.trim() || ''
  if (!token) {
    return createEmailChangeRevertResponse(
      '撤销链接无效',
      '链接缺少必要的撤销令牌。',
      400
    )
  }

  const { payload } = await getRevertPayload(token)
  if (!payload) {
    return createEmailChangeRevertResponse(
      '撤销链接已失效',
      '该链接不存在、已经使用过, 或已超过 24 小时有效期。',
      400
    )
  }

  return createEmailChangeRevertConfirmResponse(token, payload.oldEmail)
}

export const POST = async (req: NextRequest) => {
  const token = await getTokenFromBody(req)
  if (!token) {
    return createEmailChangeRevertResponse(
      '撤销链接无效',
      '链接缺少必要的撤销令牌。',
      400
    )
  }

  const { payload, revertKey } = await getRevertPayload(token)
  if (!payload) {
    return createEmailChangeRevertResponse(
      '撤销链接已失效',
      '该链接不存在、已经使用过, 或已超过 24 小时有效期。',
      400
    )
  }

  try {
    const result = await prisma.user.updateMany({
      where: {
        id: payload.uid,
        email: payload.newEmail
      },
      data: {
        email: payload.oldEmail
      }
    })

    await delKv(revertKey)

    if (result.count === 0) {
      return createEmailChangeRevertResponse(
        '无需撤销',
        '账户邮箱当前不是这次变更后的邮箱, 撤销链接已失效。',
        400
      )
    }

    return createEmailChangeRevertResponse(
      '邮箱已恢复',
      `账户邮箱已恢复为 ${payload.oldEmail}。建议您立即修改密码并检查 2FA 设置。`
    )
  } catch {
    return createEmailChangeRevertResponse(
      '撤销失败',
      '无法恢复旧邮箱。旧邮箱可能已被其他账户使用, 请联系管理员处理。',
      500
    )
  }
}
