import { z } from 'zod'
import { prisma } from '~/prisma/index'
import { markdownToHtml } from '~/app/api/utils/render/markdownToHtml'
import { getPatchCommentSchema } from '~/validations/patch'
import type { PatchComment } from '~/types/api/patch'

export const getPatchComment = async (
  input: z.infer<typeof getPatchCommentSchema>,
  uid: number
) => {
  const { patchId, page, limit } = input

  const total = await prisma.patch_comment.count({
    where: { patch_id: patchId, parent_id: null }
  })

  const rootComments = await prisma.patch_comment.findMany({
    where: { patch_id: patchId, parent_id: null },
    orderBy: { created: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
    include: {
      user: true,
      patch: {
        select: {
          unique_id: true
        }
      },
      like_by: {
        where: {
          user_id: uid
        }
      },
      _count: {
        select: { like_by: true }
      }
    }
  })

  const rootIds = rootComments.map((c) => c.id)

  const allComments = await prisma.patch_comment.findMany({
    where: { patch_id: patchId },
    include: {
      user: true,
      patch: {
        select: {
          unique_id: true
        }
      },
      like_by: {
        where: {
          user_id: uid
        }
      },
      _count: {
        select: { like_by: true }
      }
    }
  })

  const commentMap = new Map(allComments.map((c) => [c.id, c]))

  const findRootId = (commentId: number): number | null => {
    const comment = commentMap.get(commentId)
    if (!comment) return null
    if (comment.parent_id === null) return comment.id
    return findRootId(comment.parent_id)
  }

  const replyMap = new Map<number, typeof allComments>()
  for (const comment of allComments) {
    if (comment.parent_id === null) continue

    const rootId = findRootId(comment.id)
    if (rootId && rootIds.includes(rootId)) {
      if (!replyMap.has(rootId)) {
        replyMap.set(rootId, [])
      }
      replyMap.get(rootId)!.push(comment)
    }
  }

  const comments: PatchComment[] = await Promise.all(
    rootComments.map(async (comment) => {
      const replies = replyMap.get(comment.id) || []

      const replyComments: PatchComment[] = await Promise.all(
        replies
          .sort(
            (a, b) =>
              new Date(a.created).getTime() - new Date(b.created).getTime()
          )
          .map(async (reply) => {
            const directParent = commentMap.get(reply.parent_id!)
            const isReplyToRoot = reply.parent_id === comment.id

            return {
              id: reply.id,
              uniqueId: reply.patch.unique_id,
              content: await markdownToHtml(reply.content),
              isLike: reply.like_by.length > 0,
              likeCount: reply._count.like_by,
              parentId: comment.id,
              userId: reply.user_id,
              patchId: reply.patch_id,
              created: String(reply.created),
              updated: String(reply.updated),
              reply: [],
              user: {
                id: reply.user.id,
                name: reply.user.name,
                avatar: reply.user.avatar
              },
              quotedContent: null,
              quotedUsername: null,
              replyToUser:
                !isReplyToRoot && directParent
                  ? {
                      id: directParent.user.id,
                      name: directParent.user.name,
                      avatar: directParent.user.avatar
                    }
                  : null
            }
          })
      )

      return {
        id: comment.id,
        uniqueId: comment.patch.unique_id,
        content: await markdownToHtml(comment.content),
        isLike: comment.like_by.length > 0,
        likeCount: comment._count.like_by,
        parentId: null,
        userId: comment.user_id,
        patchId: comment.patch_id,
        created: String(comment.created),
        updated: String(comment.updated),
        reply: replyComments,
        user: {
          id: comment.user.id,
          name: comment.user.name,
          avatar: comment.user.avatar
        },
        quotedContent: null,
        quotedUsername: null,
        replyToUser: null
      }
    })
  )

  return { comments, total }
}
