'use client'

import { useState } from 'react'
import { Button } from '@heroui/react'
import { Textarea } from '@heroui/input'
import { Send } from 'lucide-react'
import { kunFetchPost } from '~/utils/kunFetch'
import toast from 'react-hot-toast'

interface Props {
  conversationId: number
  onMessageSent: (message: {
    id: number
    content: string
    created: string
  }) => void
}

export const ChatInput = ({ conversationId, onMessageSent }: Props) => {
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)

  const handleSend = async () => {
    const trimmedContent = content.trim()
    if (!trimmedContent) {
      return
    }

    if (trimmedContent.length > 2000) {
      toast.error('消息内容最多 2000 个字符')
      return
    }

    setSending(true)
    const response = await kunFetchPost<
      KunResponse<{ id: number; content: string; created: string }>
    >(`/message/conversation/${conversationId}`, { content: trimmedContent })

    if (typeof response === 'string') {
      toast.error(response)
    } else {
      setContent('')
      onMessageSent(response)
    }
    setSending(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (e.ctrlKey) {
        e.preventDefault()
        const target = e.target as HTMLTextAreaElement
        const start = target.selectionStart
        const end = target.selectionEnd
        const newContent = content.slice(0, start) + '\n' + content.slice(end)
        setContent(newContent)
        setTimeout(() => {
          target.selectionStart = target.selectionEnd = start + 1
        }, 0)
      } else {
        e.preventDefault()
        handleSend()
      }
    }
  }

  return (
    <div className="flex gap-2 items-end">
      <Textarea
        placeholder="输入消息... (按 Enter 发送，Ctrl+Enter 换行)"
        value={content}
        onValueChange={setContent}
        onKeyDown={handleKeyDown}
        minRows={1}
        maxRows={5}
        classNames={{
          inputWrapper: 'bg-default-100'
        }}
      />
      <Button
        color="primary"
        isIconOnly
        isLoading={sending}
        isDisabled={!content.trim()}
        onPress={handleSend}
      >
        <Send className="size-4" />
      </Button>
    </div>
  )
}
