'use client'

import {
  Tooltip,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Button
} from '@nextui-org/react'
import { useSettingStore } from '~/store/settingStore'
import { Ban, ShieldCheck, CircleSlash } from 'lucide-react'
import type { JSX } from 'react'

const themeIconMap: Record<string, JSX.Element> = {
  sfw: <ShieldCheck />,
  nsfw: <Ban />,
  all: <CircleSlash />
}

export const NSFWSwitcher = () => {
  const settings = useSettingStore((state) => state.data)
  const setData = useSettingStore((state) => state.setData)

  const themeIcon = themeIconMap[settings.kunNsfwEnable] || themeIconMap['all']

  return (
    <Dropdown className="min-w-0">
      <Tooltip
        disableAnimation
        showArrow
        closeDelay={0}
        content="NSFW 内容切换"
      >
        <div className="flex">
          <DropdownTrigger>
            <Button
              isIconOnly
              variant="light"
              aria-label="NSFW 切换"
              className="text-default-500"
            >
              {themeIcon}
            </Button>
          </DropdownTrigger>
        </div>
      </Tooltip>

      <DropdownMenu
        disallowEmptySelection
        selectedKeys={new Set([settings.kunNsfwEnable])}
        selectionMode="single"
        onSelectionChange={(key) => {
          setData({ kunNsfwEnable: key.anchorKey ?? 'sfw' })
          location.reload()
        }}
      >
        {['sfw', 'nsfw', 'all'].map((key) => (
          <DropdownItem textValue={key} key={key} className="text-default-700">
            {key === 'sfw' && '仅显示 SFW (内容安全) 的文章'}
            {key === 'nsfw' && '仅显示 NSFW (可能含有 R18) 的文章'}
            {key === 'all' && '同时显示 SFW 和 NSFW 的文章'}
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  )
}
