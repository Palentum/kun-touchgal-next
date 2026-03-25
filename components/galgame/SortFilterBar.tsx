'use client'

import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger
} from '@heroui/dropdown'
import { Button } from '@heroui/button'
import { Card, CardHeader } from '@heroui/card'
import { ArrowDownAZ, ArrowUpAZ, ChevronDown } from 'lucide-react'
import type { SortField, SortOrder } from './_sort'

interface Props {
  sortField: SortField
  setSortField: (option: SortField) => void
  sortOrder: SortOrder
  setSortOrder: (option: SortOrder) => void
}

const sortFieldLabelMap: Record<SortField, string> = {
  resource_update_time: '资源更新时间',
  created: '游戏创建时间',
  rating: '评分',
  view: '浏览量',
  download: '下载量',
  favorite: '收藏量'
}

export const SortFilterBar = ({
  sortField,
  setSortField,
  sortOrder,
  setSortOrder
}: Props) => {
  return (
    <Card className="w-full border border-default-100 bg-content1/50 backdrop-blur-lg">
      <CardHeader>
        <div className="flex gap-3">
          <Dropdown>
            <DropdownTrigger>
              <Button
                variant="flat"
                style={{
                  fontSize: '0.875rem'
                }}
                endContent={<ChevronDown className="size-4" />}
                radius="lg"
                size="lg"
              >
                {sortFieldLabelMap[sortField]}
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              aria-label="排序选项"
              selectedKeys={new Set([sortField])}
              onAction={(key) => setSortField(key as SortField)}
              selectionMode="single"
              className="min-w-[120px]"
            >
              <DropdownItem
                key="resource_update_time"
                className="text-default-700"
              >
                资源更新时间
              </DropdownItem>
              <DropdownItem key="created" className="text-default-700">
                游戏创建时间
              </DropdownItem>
              <DropdownItem key="rating" className="text-default-700">
                评分
              </DropdownItem>
              <DropdownItem key="view" className="text-default-700">
                浏览量
              </DropdownItem>
              <DropdownItem key="download" className="text-default-700">
                下载量
              </DropdownItem>
              <DropdownItem key="favorite" className="text-default-700">
                收藏量
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>

          <Button
            variant="flat"
            className="shrink-0 text-sm"
            radius="lg"
            size="lg"
            onPress={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            startContent={
              sortOrder === 'asc' ? (
                <ArrowUpAZ className="size-4" />
              ) : (
                <ArrowDownAZ className="size-4" />
              )
            }
          >
            {sortOrder === 'asc' ? '升序' : '降序'}
          </Button>
        </div>
      </CardHeader>
    </Card>
  )
}
