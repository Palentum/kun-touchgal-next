import { ScrollShadow } from '@nextui-org/scroll-shadow'
import { Tooltip } from '@nextui-org/tooltip'
import { Download, Eye, Heart, MessageSquare, Puzzle } from 'lucide-react'
import { cn } from '~/utils/cn'

interface Props {
  patch: GalgameCard
  disableTooltip?: boolean
  className?: string
}

export const KunCardStats = ({
  patch,
  disableTooltip = true,
  className = ''
}: Props) => {
  return (
    <ScrollShadow
      orientation="horizontal"
      className={cn('max-w-full scrollbar-hide', className)}
    >
      <div className="flex space-x-2 text-sm sm:space-x-4 text-default-500">
        <Tooltip
          isDisabled={disableTooltip}
          content="浏览数"
          placement="bottom"
        >
          <div className="flex items-center gap-1">
            <Eye className="size-4" />
            <span>{patch.view}</span>
          </div>
        </Tooltip>

        <Tooltip
          isDisabled={disableTooltip}
          content="下载数"
          placement="bottom"
        >
          <div className="flex items-center gap-1">
            <Download className="size-4" />
            <span>{patch.download}</span>
          </div>
        </Tooltip>

        <Tooltip
          isDisabled={disableTooltip}
          content="收藏数"
          placement="bottom"
        >
          <div className="flex items-center gap-1">
            <Heart className="size-4" />
            <span>{patch._count.favorite_by || 0}</span>
          </div>
        </Tooltip>

        <Tooltip
          isDisabled={disableTooltip}
          content="下载资源数"
          placement="bottom"
        >
          <div className="flex items-center gap-1">
            <Puzzle className="size-4" />
            <span>{patch._count.resource || 0}</span>
          </div>
        </Tooltip>

        <Tooltip
          isDisabled={disableTooltip}
          content="评论数"
          placement="bottom"
        >
          <div className="flex items-center gap-1">
            <MessageSquare className="size-4" />
            <span>{patch._count.comment || 0}</span>
          </div>
        </Tooltip>
      </div>
    </ScrollShadow>
  )
}
