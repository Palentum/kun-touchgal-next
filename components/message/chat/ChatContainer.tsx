'use client'

import { useEffect, useRef, useState } from 'react'
import { Card, CardBody, CardHeader } from '@heroui/card'
import { Button } from '@heroui/react'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useMounted } from '~/hooks/useMounted'
import { KunLoading } from '~/components/kun/Loading'
import { KunNull } from '~/components/kun/Null'
import { KunPagination } from '~/components/kun/Pagination'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { KunAvatar } from '~/components/kun/floating-card/KunAvatar'
import { kunFetchGet, kunFetchPut } from '~/utils/kunFetch'
import { useUserStore } from '~/store/userStore'
import toast from 'react-hot-toast'
import type { PrivateMessage } from '~/types/api/conversation'

interface Props {
  conversationId: number
  initialMessages: PrivateMessage[]
  total: number
  otherUser: KunUser
}

export const ChatContainer = ({
  conversationId,
  initialMessages,
  total,
  otherUser
}: Props) => {
  const [messages, setMessages] = useState<PrivateMessage[]>(initialMessages)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalMessages, setTotalMessages] = useState(total)
  const isMounted = useMounted()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const user = useUserStore((state) => state.user)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchMessages = async (newPage?: number) => {
    setLoading(true)

    const response = await kunFetchGet<
      KunResponse<{
        messages: PrivateMessage[]
        total: number
        otherUser: KunUser
      }>
    >(`/message/conversation/${conversationId}`, {
      page: newPage ?? page,
      limit: 50
    })

    if (typeof response === 'string') {
      toast.error(response)
    } else {
      setMessages(response.messages)
      setTotalMessages(response.total)
    }

    setLoading(false)
  }

  const handleMessageSent = () => {
    setPage(1)
    fetchMessages(1)
  }

  useEffect(() => {
    const markAsRead = async () => {
      await kunFetchPut(`/message/conversation/${conversationId}/read`)
    }
    markAsRead()
  }, [conversationId])

  useEffect(() => {
    if (!isMounted) {
      return
    }
    fetchMessages()
  }, [page])

  useEffect(() => {
    if (page === 1) {
      scrollToBottom()
    }
  }, [messages, page])

  const reversedMessages = [...messages].reverse()

  return (
    <Card className="h-[calc(100vh-200px)] min-h-[500px]">
      <CardHeader className="border-b border-default-200 flex items-center gap-3">
        <Button
          as={Link}
          href="/message/chat"
          variant="light"
          isIconOnly
          size="sm"
        >
          <ArrowLeft className="size-4" />
        </Button>
        <KunAvatar
          uid={otherUser.id}
          avatarProps={{
            src: otherUser.avatar,
            name: otherUser.name,
            size: 'sm'
          }}
        />
        <span className="font-semibold">{otherUser.name}</span>
      </CardHeader>

      <CardBody className="flex flex-col p-0">
        <div className="flex-1 overflow-y-auto p-4">
          {totalMessages > 50 && (
            <div className="flex justify-center mb-4">
              <KunPagination
                total={Math.ceil(totalMessages / 50)}
                page={page}
                onPageChange={setPage}
                isLoading={loading}
              />
            </div>
          )}

          {loading ? (
            <KunLoading hint="正在获取消息..." />
          ) : reversedMessages.length === 0 ? (
            <KunNull message="暂无消息，发送第一条消息吧" />
          ) : (
            <>
              {reversedMessages.map((msg) => (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  isOwn={msg.sender.id === user.uid}
                />
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        <div className="border-t border-default-200 p-4">
          <ChatInput
            conversationId={conversationId}
            onMessageSent={handleMessageSent}
          />
        </div>
      </CardBody>
    </Card>
  )
}
