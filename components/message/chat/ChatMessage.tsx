import { cn } from '~/utils/cn'
import { formatTimeDifference } from '~/utils/time'
import { KunAvatar } from '~/components/kun/floating-card/KunAvatar'
import type { PrivateMessage } from '~/types/api/conversation'

interface Props {
  message: PrivateMessage
  isOwn: boolean
}

export const ChatMessage = ({ message, isOwn }: Props) => {
  return (
    <div
      className={cn('flex gap-3 mb-4', isOwn ? 'flex-row-reverse' : 'flex-row')}
    >
      <KunAvatar
        uid={message.sender.id}
        avatarProps={{
          src: message.sender.avatar,
          name: message.sender.name,
          className: 'shrink-0'
        }}
      />

      <div
        className={cn(
          'max-w-[70%] rounded-2xl px-4 py-2',
          isOwn
            ? 'bg-primary-500 text-white'
            : 'bg-default-100 dark:bg-default-200'
        )}
      >
        <p className="text-sm whitespace-pre-wrap break-words">
          {message.content}
        </p>
        <span
          className={cn(
            'text-xs mt-1 block',
            isOwn ? 'text-primary-100' : 'text-default-400'
          )}
        >
          {formatTimeDifference(message.created)}
        </span>
      </div>
    </div>
  )
}
