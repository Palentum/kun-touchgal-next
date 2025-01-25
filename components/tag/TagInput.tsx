'use client'

import { Input } from '@nextui-org/react'
import { Button } from '@nextui-org/react'
import { Search } from 'lucide-react'
import { Chip } from '@nextui-org/react'
import { ScrollShadow } from '@nextui-org/react'
import type { Tag as TagType } from '~/types/api/tag'

interface TagInputProps {
  query: string
  setQuery: (value: string) => void
  handleSearch: () => void
  suggestions: TagType[]
  selectedTags: string[]
  onTagSelect: (tag: string) => void
  onTagRemove: (tag: string) => void
}

export const TagInput = ({
  query,
  setQuery,
  handleSearch,
  suggestions,
  selectedTags,
  onTagSelect,
  onTagRemove
}: TagInputProps) => {
  return (
    <div>
      <div
        className={`flex flex-wrap ${selectedTags.length ? 'mb-4 gap-2' : ''}`}
      >
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
          autoFocus
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
            className="absolute z-50 w-full bg-background mt-1 rounded-2xl shadow-lg border border-default-200 max-h-[200px] overflow-auto"
            hideScrollBar
          >
            {suggestions.map((tag) => (
              <div
                key={tag.id}
                className="flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-default-100"
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
    </div>
  )
}
