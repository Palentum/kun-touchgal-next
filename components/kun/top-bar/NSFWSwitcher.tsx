'use client'

import { useMemo } from 'react'
import {
  Tooltip,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Button
} from '@nextui-org/react'
import { useSettingStore } from '~/store/settingStore'
import { Ban, ShieldCheck } from 'lucide-react'

export const NSFWSwitcher = () => {
  const settings = useSettingStore((state) => state.data)
  const setData = useSettingStore((state) => state.setData)

  const themeIcon = useMemo(() => {
    if (settings.kunNsfwEnable) {
      return <Ban />
    }
    return <ShieldCheck />
  }, [settings.kunNsfwEnable])

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
        selectedKeys={new Set([settings.kunNsfwEnable ? 'nsfw' : 'sfw'])}
        selectionMode="single"
        onSelectionChange={(key) => {
          setData({ kunNsfwEnable: key.anchorKey === 'nsfw' })
        }}
      >
        <DropdownItem key="sfw" className="text-default-700">
          仅显示 SFW (内容安全, 无 R18 等) 的文章
        </DropdownItem>
        <DropdownItem key="nsfw" className="text-default-700">
          显示 NSFW (可能含有 R18 等) 的文章
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  )
}
