'use client'

import { Button, Tooltip } from '@nextui-org/react'
import { Pencil } from 'lucide-react'
import { useRouter } from 'next-nprogress-bar'

export const EditButton = () => {
  const router = useRouter()

  return (
    <Tooltip content="编辑游戏信息">
      <Button
        variant="bordered"
        isIconOnly
        aria-label="编辑游戏信息"
        onPress={() => router.push('/edit/rewrite')}
      >
        <Pencil className="size-4" />
      </Button>
    </Tooltip>
  )
}
