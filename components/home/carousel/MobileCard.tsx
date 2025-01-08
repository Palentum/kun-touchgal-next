'use client'

import { Card, Chip, Button } from '@nextui-org/react'
import { Dices } from 'lucide-react'
import { docDirectoryLabelMap } from '~/constants/doc'
import { formatDistanceToNow } from '~/utils/formatDistanceToNow'
import type { HomeCarouselMetadata } from './mdx'

interface Props {
  posts: HomeCarouselMetadata[]
  currentSlide: number
}

export const KunMobileCard = ({ posts, currentSlide }: Props) => {
  return (
    <Card className="h-full bg-transparent border-none shadow-none sm:hidden">
      <div className="relative h-1/2">
        <img
          alt={posts[currentSlide].title}
          className="object-cover w-full h-full rounded-2xl"
          src={posts[currentSlide].banner}
        />
      </div>
      <div className="py-3 h-1/2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <img
              src={posts[currentSlide].authorAvatar}
              alt={posts[currentSlide].authorName}
              className="w-8 h-8 rounded-full"
            />
            <span className="text-sm text-foreground/80">
              {posts[currentSlide].authorName}
            </span>
          </div>

          <Button
            color="primary"
            variant="flat"
            startContent={<Dices size={18} />}
            size="sm"
          >
            随机一部游戏
          </Button>
        </div>

        <h2 className="mb-1 text-lg font-bold line-clamp-1">
          {posts[currentSlide].title}
        </h2>
        <p className="mb-2 text-xs text-foreground/80 line-clamp-2">
          {posts[currentSlide].description}
        </p>
        <div className="flex flex-wrap gap-1">
          <Chip variant="flat" size="sm" color="primary">
            {docDirectoryLabelMap[posts[currentSlide].directory]}
          </Chip>
          <Chip variant="flat" size="sm">
            {formatDistanceToNow(posts[currentSlide].date)}
          </Chip>
        </div>
      </div>
    </Card>
  )
}
