'use client'

import { Chip } from '@nextui-org/chip'
import { ScrollShadow } from '@nextui-org/scroll-shadow'
import {
  SUPPORTED_LANGUAGE_MAP,
  SUPPORTED_PLATFORM_MAP,
  SUPPORTED_TYPE_MAP
} from '~/constants/resource'

interface Props {
  types: string[]
  languages?: string[]
  platforms?: string[]
  tags?: string[]
  size?: 'lg' | 'md' | 'sm'
  enableTags?: boolean
}

export const KunPatchAttribute = ({
  types,
  languages = [],
  platforms = [],
  tags = [],
  size = 'md',
  enableTags = false
}: Props) => {
  if (enableTags) {
    return (
      <ScrollShadow
        isEnabled={false}
        orientation="horizontal"
        className="max-w-full scrollbar-hide"
      >
        <div className="flex gap-2 w-max">
          {types.map((type) => (
            <Chip key={type} variant="flat" color="primary" size={size}>
              {SUPPORTED_TYPE_MAP[type]}
            </Chip>
          ))}
          {tags?.map((tag, index) => (
            <Chip key={index} variant="flat" size={size}>
              {tag}
            </Chip>
          ))}
        </div>
      </ScrollShadow>
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {types.map((type) => (
        <Chip key={type} variant="flat" color="primary" size={size}>
          {SUPPORTED_TYPE_MAP[type]}
        </Chip>
      ))}
      {languages?.map((lang) => (
        <Chip key={lang} variant="flat" color="secondary" size={size}>
          {SUPPORTED_LANGUAGE_MAP[lang]}
        </Chip>
      ))}
      {platforms?.map((platform) => (
        <Chip key={platform} variant="flat" color="success" size={size}>
          {SUPPORTED_PLATFORM_MAP[platform]}
        </Chip>
      ))}
    </div>
  )
}
