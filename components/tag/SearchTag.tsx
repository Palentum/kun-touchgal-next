'use client'

import { Input } from '@nextui-org/input'
import { Button } from '@nextui-org/react'
import { Search } from 'lucide-react'
import { Chip } from '@nextui-org/chip'
import { ScrollShadow } from '@nextui-org/scroll-shadow'
import { KunLoading } from '~/components/kun/Loading'
import type { Tag as TagType } from '~/types/api/tag'

interface SearchTagsProps {
  query: string
  setQuery: (value: string) => void
  handleSearch: () => void
  searching: boolean
  suggestions: TagType[]
  selectedTags: string[]
  onTagSelect: (tag: string) => void
  onTagRemove: (tag: string) => void
}

export const SearchTags = ({
  query,
  setQuery,
  handleSearch,
  searching,
  suggestions,
  selectedTags,
  onTagSelect,
  onTagRemove
}: SearchTagsProps) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 min-h-[40px]">
        {selectedTags.map((tag) => (
          <Chip
            key={tag}
            onClose={() => onTagRemove(tag)}
            variant="flat"
            color="primary"
          >
            {tag}
          </Chip>
        ))}
      </div>

      <div className="relative">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="输入标签名称进行搜索"
          endContent={
            <Button
              isIconOnly
              variant="light"
              aria-label="搜索 Galgame 标签"
              onPress={handleSearch}
            >
              <Search />
            </Button>
          }
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSearch()
          }}
        />

        {suggestions.length > 0 && query && (
          <ScrollShadow
            className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-[200px] overflow-auto"
            hideScrollBar
          >
            {suggestions.map((tag) => (
              <div
                key={tag.id}
                className="flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-gray-100"
                onClick={() => {
                  onTagSelect(tag.name)
                  setQuery('')
                }}
              >
                <span>{tag.name}</span>
                <Chip size="sm" variant="flat" color="primary">
                  {tag.count}
                </Chip>
              </div>
            ))}
          </ScrollShadow>
        )}
      </div>

      {searching && <KunLoading hint="正在搜索标签数据..." />}
    </div>
  )
}
