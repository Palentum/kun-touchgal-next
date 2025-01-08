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

export const KunDesktopCard = ({ posts, currentSlide }: Props) => {
  return (
    <div className="hidden h-full sm:block">
      <img
        alt={posts[currentSlide].title}
        className="object-cover w-full h-full brightness-75 rounded-2xl"
        src={posts[currentSlide].banner}
      />
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/30 via-black/10 to-transparent" />
      <Card className="absolute border-none bottom-4 left-4 right-4 bg-background/80 backdrop-blur-md">
        <div className="p-4">
          <div className="flex justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <img
                  src={posts[currentSlide].authorAvatar}
                  alt={posts[currentSlide].authorName}
                  className="w-6 h-6 rounded-full"
                />
                <span className="text-sm text-foreground/80">
                  {posts[currentSlide].authorName}
                </span>
              </div>
              <h2 className="mb-2 text-2xl font-bold line-clamp-1">
                {posts[currentSlide].title}
              </h2>
            </div>

            <Button
              color="primary"
              variant="solid"
              startContent={<Dices size={18} />}
            >
              随机一部游戏
            </Button>
          </div>

          <p className="mb-2 text-sm text-foreground/80 line-clamp-1">
            {posts[currentSlide].description}
          </p>
          <div className="flex flex-wrap gap-2">
            <Chip variant="flat" size="sm" color="primary">
              {docDirectoryLabelMap[posts[currentSlide].directory]}
            </Chip>

            <Chip variant="flat" size="sm">
              {formatDistanceToNow(posts[currentSlide].date)}
            </Chip>
          </div>
        </div>
      </Card>
    </div>
  )
}
