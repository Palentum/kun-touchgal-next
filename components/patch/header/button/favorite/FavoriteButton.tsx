'use client'

import { Button, useDisclosure } from '@nextui-org/react'
import { Tooltip } from '@nextui-org/tooltip'
import { Heart } from 'lucide-react'
import { useUserStore } from '~/store/userStore'
import toast from 'react-hot-toast'
import { cn } from '~/utils/cn'
import { FavoriteModal } from './FavoriteModal'

interface Props {
  patchId: number
  isFavorite: boolean
}

export const FavoriteButton = ({ patchId, isFavorite }: Props) => {
  const { user } = useUserStore((state) => state)
  const { isOpen, onOpen, onClose } = useDisclosure()

  const toggleLike = async () => {
    if (!user.uid) {
      toast.error('请登录以收藏')
      return
    }

    onOpen()
  }

  return (
    <>
      <Tooltip key="favorite" color="default" content="添加到收藏夹">
        <Button
          isIconOnly
          variant="bordered"
          onPress={toggleLike}
          className="min-w-0 px-2"
        >
          <Heart
            fill={isFavorite ? '#f31260' : '#00000000'}
            className={cn('size-4', isFavorite ? 'text-danger-500' : '')}
          />
        </Button>
      </Tooltip>

      <FavoriteModal patchId={patchId} isOpen={isOpen} onClose={onClose} />
    </>
  )
}
