'use client'

import { useState } from 'react'
import { Button } from '@heroui/react'
import { MessageSquare } from 'lucide-react'
import { kunFetchPost } from '~/utils/kunFetch'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface Props {
  targetUserId: number
}

export const StartChatButton = ({ targetUserId }: Props) => {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleStartChat = async () => {
    setLoading(true)
    const response = await kunFetchPost<
      KunResponse<{ conversationId: number; isNew: boolean }>
    >('/message/conversation', { targetUserId })

    if (typeof response === 'string') {
      toast.error(response)
      setLoading(false)
      return
    }

    router.push(`/message/chat/${response.conversationId}`)
  }

  return (
    <Button
      startContent={<MessageSquare className="size-4" />}
      color="default"
      variant="flat"
      fullWidth
      isLoading={loading}
      onPress={handleStartChat}
    >
      私聊
    </Button>
  )
}
