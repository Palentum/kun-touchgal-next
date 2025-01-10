'use client'

import { callCommand } from '@milkdown/utils'
import { MenuButton } from './MenuButton'
import { createButtons } from './_buttonList'
import { VideoInsertButton } from './components/video/VideoInsertButton'
import { LinkInsertButton } from './components/link/LinkInsertButton'
import { ImageUploadButton } from './components/ImageUploadButton'
import { EmojiPicker } from './components/emoji/EmojiPicker'
import type { CmdKey } from '@milkdown/core'
import type { UseEditorReturn } from '@milkdown/react'

export const KunMilkdownPluginsMenu = ({
  editorInfo
}: {
  editorInfo: UseEditorReturn
}) => {
  const { get } = editorInfo
  const call = <T,>(command: CmdKey<T>, payload?: T) => {
    return get()?.action(callCommand(command, payload))
  }

  const buttonList = createButtons(call)

  return (
    <div className="sticky top-0 flex flex-wrap">
      {buttonList.map(({ tooltip, icon, onPress, ariaLabel }, index) => (
        <MenuButton
          key={index}
          tooltip={tooltip}
          icon={icon}
          onPress={onPress}
          ariaLabel={ariaLabel}
        />
      ))}

      <EmojiPicker editorInfo={editorInfo} />

      <LinkInsertButton call={call} />

      <ImageUploadButton editorInfo={editorInfo} />

      <VideoInsertButton call={call} />
    </div>
  )
}
