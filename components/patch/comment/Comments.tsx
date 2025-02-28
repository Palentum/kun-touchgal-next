'use client'

import { useEffect, useState } from 'react'
import { Card, CardBody } from '@nextui-org/card'
import { Button } from '@nextui-org/button'
import { KunUser } from '~/components/kun/floating-card/KunUser'
import { MessageCircle } from 'lucide-react'
import { kunFetchGet } from '~/utils/kunFetch'
import { formatDistanceToNow } from '~/utils/formatDistanceToNow'
import { PublishComment } from './PublishComment'
import { CommentLikeButton } from './CommentLike'
import { CommentDropdown } from './CommentDropdown'
import { CommentContent } from './CommentContent'
import { scrollIntoComment } from './_scrollIntoComment'
import { useUserStore } from '~/store/userStore'
import { KunNull } from '~/components/kun/Null'
import { cn } from '~/utils/cn'
import type { PatchComment } from '~/types/api/patch'

interface Props {
  initialComments: PatchComment[]
  id: number
}

export const Comments = ({ id }: Props) => {
  const [comments, setComments] = useState<PatchComment[]>([])
  const [replyTo, setReplyTo] = useState<number | null>(null)
  const user = useUserStore((state) => state.user)

  useEffect(() => {
    if (!user.uid) {
      return
    }

    const fetchData = async () => {
      const res = await kunFetchGet<PatchComment[]>('/patch/comment', {
        patchId: Number(id)
      })
      setComments(res)
    }
    fetchData()
  }, [])

  const setNewComment = async (newComment: PatchComment) => {
    setComments([...comments, newComment])
    await new Promise((resolve) => {
      setTimeout(resolve, 500)
    })
    scrollIntoComment(newComment.id)
  }

  if (!user.uid) {
    return <KunNull message="请登陆后查看评论" />
  }

  const renderComments = (comments: PatchComment[], depth = 0) => {
    return comments.map((comment) => (
      <div
        key={comment.id}
        className={cn(depth <= 3 && depth !== 0 ? `ml-4` : 'ml-0', 'space-y-4')}
      >
        <Card id={`comment-${comment.id}`}>
          <CardBody>
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <KunUser
                  user={comment.user}
                  userProps={{
                    name: comment.user.name,
                    description: formatDistanceToNow(comment.created),
                    avatarProps: {
                      showFallback: true,
                      name: comment.user.name,
                      src: comment.user.avatar
                    }
                  }}
                />
                <CommentDropdown comment={comment} setComments={setComments} />
              </div>

              <CommentContent comment={comment} />

              <div className="flex gap-2 mt-2">
                <CommentLikeButton comment={comment} />
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2"
                  onPress={() =>
                    setReplyTo(replyTo === comment.id ? null : comment.id)
                  }
                >
                  <MessageCircle className="size-4" />
                  回复
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>

        {replyTo === comment.id && (
          <div className="mt-2 ml-8">
            <PublishComment
              patchId={id}
              parentId={comment.id}
              receiverUsername={comment.quotedUsername}
              onSuccess={() => setReplyTo(null)}
              setNewComment={setNewComment}
            />
          </div>
        )}

        {comment.reply && comment.reply.length > 0 && (
          <>{renderComments(comment.reply, depth + 1)}</>
        )}
      </div>
    ))
  }

  return (
    <div className="space-y-4">
      <PublishComment
        patchId={id}
        receiverUsername={null}
        setNewComment={setNewComment}
      />
      {renderComments(comments)}
    </div>
  )
}
