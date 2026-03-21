import { z } from 'zod'
import { prisma } from '~/prisma/index'
import { adminDeleteCommentSchema } from '~/validations/admin'

export const deleteComment = async (
  input: z.infer<typeof adminDeleteCommentSchema>,
  uid: number
) => {
  const comments = await prisma.patch_comment.findMany({
    where: {
      id: {
        in: input.commentIds
      }
    }
  })
  if (!comments.length) {
    return '未找到对应的评论'
  }

  const admin = await prisma.user.findUnique({ where: { id: uid } })
  if (!admin) {
    return '未找到该管理员'
  }

  return await prisma.$transaction(async (prisma) => {
    await prisma.patch_comment.deleteMany({
      where: {
        id: {
          in: comments.map((comment) => comment.id)
        }
      }
    })

    const logContent =
      comments.length > 1
        ? `管理员 ${admin.name} 批量删除了 ${comments.length} 条评论\n评论 ID: ${comments
            .map((comment) => comment.id)
            .join(', ')}\n原评论: ${JSON.stringify(comments)}`
        : `管理员 ${admin.name} 删除了一条评论\n原评论: ${JSON.stringify(comments[0])}`

    await prisma.admin_log.create({
      data: {
        type: 'delete',
        user_id: uid,
        content: logContent
      }
    })

    return {}
  })
}
