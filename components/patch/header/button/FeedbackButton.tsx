'use client'

import { Button, Tooltip } from '@nextui-org/react'
import { MessageCircleQuestion } from 'lucide-react'
import { useRouter } from 'next-nprogress-bar'

export const FeedbackButton = () => {
  const router = useRouter()

  return (
    <Tooltip content="游戏反馈">
      <Button
        variant="bordered"
        isIconOnly
        aria-label="游戏反馈"
        onPress={() => router.push('/edit/rewrite')}
      >
        <MessageCircleQuestion className="size-4" />
      </Button>
    </Tooltip>
  )
}
