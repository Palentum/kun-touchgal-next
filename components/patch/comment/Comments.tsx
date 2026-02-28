'use client'

import { useEffect, useState } from 'react'
import { Card, CardBody } from '@heroui/card'
import { Button } from '@heroui/button'
import { Pagination } from '@heroui/pagination'
import { Divider } from '@heroui/divider'
import { KunUser } from '~/components/kun/floating-card/KunUser'
import { MessageCircle } from 'lucide-react'
import { kunFetchGet } from '~/utils/kunFetch'
import { formatTimeDifference } from '~/utils/time'
import { PublishComment } from './PublishComment'
import { CommentLikeButton } from './CommentLike'
import { CommentDropdown } from './CommentDropdown'
import { CommentContent } from './CommentContent'
import { useUserStore } from '~/store/userStore'
import { KunNull } from '~/components/kun/Null'
import type { PatchComment, PatchCommentResponse } from '~/types/api/patch'

interface Props {
  id: number
}

const COMMENTS_PER_PAGE = 30

export const Comments = ({ id }: Props) => {
  const [comments, setComments] = useState<PatchComment[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [replyTo, setReplyTo] = useState<{
    commentId: number
    username: string
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const user = useUserStore((state) => state.user)

  const fetchComments = async (pageNum: number) => {
    setLoading(true)
    const res = await kunFetchGet<PatchCommentResponse>('/patch/comment', {
      patchId: Number(id),
      page: pageNum,
      limit: COMMENTS_PER_PAGE
    })
    if (res && typeof res !== 'string') {
      setComments(res.comments)
      setTotal(res.total)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (!user.uid) {
      return
    }
    fetchComments(page)
  }, [page, user.uid])

  const handleNewComment = async (newComment: PatchComment) => {
    if (newComment.parentId === null) {
      setComments((prev) => [newComment, ...prev])
      setTotal((prev) => prev + 1)
    } else {
      setComments((prev) =>
        prev.map((comment) => {
          if (comment.id === newComment.parentId) {
            return {
              ...comment,
              reply: [...comment.reply, newComment]
            }
          }
          return comment
        })
      )
    }
    setReplyTo(null)
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (!user.uid) {
    return <KunNull message="请登陆后查看评论" />
  }

  const totalPages = Math.ceil(total / COMMENTS_PER_PAGE)

  return (
    <div className="space-y-4">
      <PublishComment
        patchId={id}
        receiverUsername={null}
        setNewComment={handleNewComment}
      />

      {loading && <KunNull message="加载中..." />}

      {!loading &&
        comments.map((comment) => (
          <Card key={comment.id} id={`comment-${comment.id}`}>
            <CardBody className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <KunUser
                    user={comment.user}
                    userProps={{
                      name: comment.user.name,
                      description: formatTimeDifference(comment.created),
                      avatarProps: {
                        showFallback: true,
                        name: comment.user.name,
                        src: comment.user.avatar
                      }
                    }}
                  />
                  <CommentDropdown
                    comment={comment}
                    setComments={setComments}
                  />
                </div>

                <CommentContent comment={comment} />

                <div className="flex gap-2">
                  <CommentLikeButton comment={comment} />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2"
                    onPress={() =>
                      setReplyTo(
                        replyTo?.commentId === comment.id
                          ? null
                          : {
                              commentId: comment.id,
                              username: comment.user.name
                            }
                      )
                    }
                  >
                    <MessageCircle className="size-4" />
                    回复
                  </Button>
                </div>
              </div>

              {comment.reply.length > 0 && (
                <>
                  <Divider />
                  <div className="space-y-3 pl-4 border-l-2 border-default-200">
                    {comment.reply.map((reply) => (
                      <div
                        key={reply.id}
                        id={`comment-${reply.id}`}
                        className="space-y-2"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <KunUser
                              user={reply.user}
                              userProps={{
                                name: reply.user.name,
                                description: reply.replyToUser
                                  ? `回复了 @${reply.replyToUser.name} · ${formatTimeDifference(reply.created)}`
                                  : formatTimeDifference(reply.created),
                                avatarProps: {
                                  showFallback: true,
                                  name: reply.user.name,
                                  src: reply.user.avatar,
                                  size: 'sm'
                                }
                              }}
                            />
                          </div>
                          <CommentDropdown
                            comment={reply}
                            setComments={setComments}
                          />
                        </div>

                        <CommentContent comment={reply} />

                        <div className="flex gap-2">
                          <CommentLikeButton comment={reply} />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-2"
                            onPress={() =>
                              setReplyTo(
                                replyTo?.commentId === reply.id
                                  ? null
                                  : {
                                      commentId: reply.id,
                                      username: reply.user.name
                                    }
                              )
                            }
                          >
                            <MessageCircle className="size-4" />
                            回复
                          </Button>
                        </div>

                        {replyTo?.commentId === reply.id && (
                          <div className="mt-2">
                            <PublishComment
                              patchId={id}
                              parentId={reply.id}
                              receiverUsername={replyTo.username}
                              onSuccess={() => setReplyTo(null)}
                              setNewComment={(newComment) => {
                                handleNewComment({
                                  ...newComment,
                                  parentId: comment.id,
                                  replyToUser: reply.user
                                })
                              }}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}

              {replyTo?.commentId === comment.id && (
                <div className="mt-2 pl-4">
                  <PublishComment
                    patchId={id}
                    parentId={comment.id}
                    receiverUsername={replyTo.username}
                    onSuccess={() => setReplyTo(null)}
                    setNewComment={handleNewComment}
                  />
                </div>
              )}
            </CardBody>
          </Card>
        ))}

      {!loading && comments.length === 0 && (
        <KunNull message="暂无评论，来发表第一条评论吧" />
      )}

      {totalPages > 1 && (
        <div className="flex justify-center mt-4">
          <Pagination
            total={totalPages}
            page={page}
            onChange={handlePageChange}
            showControls
          />
        </div>
      )}
    </div>
  )
}
