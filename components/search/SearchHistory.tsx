'use client'

import { Button } from '@heroui/react'
import { Chip } from '@heroui/chip'
import { Clock, X } from 'lucide-react'
import { useSearchStore } from '~/store/searchStore'
import type { Dispatch, SetStateAction } from 'react'
import type { SearchSuggestionType } from '~/types/api/search'

interface Props {
  showHistory: boolean
  setShowHistory: Dispatch<SetStateAction<boolean>>
  setSelectedSuggestions: Dispatch<SetStateAction<SearchSuggestionType[]>>
}

export const SearchHistory = ({
  showHistory,
  setShowHistory,
  setSelectedSuggestions
}: Props) => {
  const searchData = useSearchStore((state) => state.data)
  const setSearchData = useSearchStore((state) => state.setData)

  const handleHistoryClick = (historyItem: SearchSuggestionType[]) => {
    setShowHistory(false)
    setSelectedSuggestions(historyItem)
  }

  const handleHistoryDelete = (historyIndex: number) => {
    setSearchData({
      ...searchData,
      searchHistory: searchData.searchHistory.filter(
        (_, index) => index !== historyIndex
      )
    })
  }

  return (
    <>
      {showHistory && searchData.searchHistory.length > 0 && (
        <div className="absolute z-50 w-full border shadow-lg rounded-2xl bg-content1 border-default-200">
          <div className="flex items-center justify-between p-2 border-b border-default-200">
            <span className="flex items-center gap-1 text-sm text-default-500">
              <Clock size={16} /> 搜索历史
            </span>
            <Button
              size="sm"
              variant="light"
              color="danger"
              startContent={<X size={16} />}
              onPress={() =>
                setSearchData({ ...searchData, searchHistory: [] })
              }
            >
              清除全部历史
            </Button>
          </div>

          <div className="overflow-y-auto max-h-60">
            {searchData.searchHistory.map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-2 cursor-pointer hover:bg-default-100 rounded-2xl"
                onMouseDown={() => handleHistoryClick(item)}
              >
                <Clock size={16} className="shrink-0 text-default-400" />
                <div className="flex flex-wrap flex-1 gap-1">
                  {item.map((s, i) => (
                    <Chip
                      key={i}
                      size="sm"
                      variant="flat"
                      color={
                        s.type === 'tag'
                          ? 'secondary'
                          : s.type === 'company'
                            ? 'warning'
                            : 'default'
                      }
                    >
                      {s.type === 'tag'
                        ? `#${s.name}`
                        : s.type === 'company'
                          ? `会社:${s.name}`
                          : s.name}
                    </Chip>
                  ))}
                </div>
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  className="shrink-0 text-default-400"
                  aria-label="删除该条搜索历史"
                  onMouseDown={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                  }}
                  onPress={() => handleHistoryDelete(index)}
                >
                  <X size={16} />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
