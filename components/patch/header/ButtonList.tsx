'use client'

import { Chip } from '@nextui-org/chip'
import { Tooltip } from '@nextui-org/tooltip'
import { FavoriteButton } from './button/FavoriteButton'
import { ShareButton } from './button/ShareButton'
import { EditButton } from './button/EditButton'
import { DownloadButton } from './button/DownloadButton'
import { DeleteButton } from './button/DeleteButton'
import { FeedbackButton } from './button/FeedbackButton'
import { Tags } from './Tags'
import {
  GALGAME_AGE_LIMIT_DETAIL,
  GALGAME_AGE_LIMIT_MAP
} from '~/constants/galgame'
import { useUserStore } from '~/store/providers/user'
import type { Patch } from '~/types/api/patch'

interface Props {
  patch: Patch
}

export const ButtonList = ({ patch }: Props) => {
  const user = useUserStore((state) => state.user)

  return (
    <div className="flex flex-col items-start justify-between space-y-2 sm:space-y-0 sm:flex-row">
      <div className="space-y-2">
        <h1 className="text-xl font-bold sm:text-3xl">
          <span>{patch.name}</span>
          <Tooltip content={GALGAME_AGE_LIMIT_DETAIL[patch.contentLimit]}>
            <Chip
              color={patch.contentLimit === 'sfw' ? 'success' : 'danger'}
              variant="flat"
              className="ml-2"
            >
              {GALGAME_AGE_LIMIT_MAP[patch.contentLimit]}
            </Chip>
          </Tooltip>
        </h1>
        <div className="flex-wrap hidden gap-2 sm:flex">
          <Tags patch={patch} />
        </div>
      </div>
      <div className="flex gap-2 ml-auto">
        <DownloadButton patch={patch} />
        <FavoriteButton patchId={patch.id} isFavorite={patch.isFavorite} />
        <ShareButton patch={patch} />

        {user.role > 2 ? (
          <>
            <EditButton />
            <DeleteButton patch={patch} />
          </>
        ) : (
          <FeedbackButton patch={patch} />
        )}
      </div>
    </div>
  )
}
