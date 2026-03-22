'use client'

import { Button } from '@heroui/button'
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger
} from '@heroui/dropdown'
import { MoreVertical } from 'lucide-react'
import { useUserStore } from '~/store/userStore'
import type { AdminReport } from '~/types/api/admin'

interface Props {
  initialReport: AdminReport
}

export const ReportHandler = ({ initialReport }: Props) => {
  const currentUser = useUserStore((state) => state.user)
  const reportedUid =
    initialReport.reportedUserId ?? initialReport.reportedUser?.id
  const userLink = reportedUid ? `/user/${reportedUid}/comment` : ''
  const disabledKeys = [
    ...(initialReport.link ? [] : ['game']),
    ...(userLink ? [] : ['user'])
  ]

  return (
    <Dropdown>
      <DropdownTrigger>
        <Button
          isIconOnly
          size="sm"
          variant="light"
          isDisabled={currentUser.role < 3}
        >
          <MoreVertical size={16} />
        </Button>
      </DropdownTrigger>
      <DropdownMenu disabledKeys={disabledKeys}>
        <DropdownItem
          key="game"
          onPress={() => {
            if (initialReport.link) {
              window.open(initialReport.link, '_blank', 'noopener,noreferrer')
            }
          }}
        >
          前往游戏
        </DropdownItem>
        <DropdownItem
          key="user"
          onPress={() => {
            if (userLink) {
              window.open(userLink, '_blank', 'noopener,noreferrer')
            }
          }}
        >
          前往用户
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  )
}
