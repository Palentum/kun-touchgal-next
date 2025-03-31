'use client'

import { useEffect, useState } from 'react'
import { Button, Chip } from '@nextui-org/react'
import { KunLoading } from '~/components/kun/Loading'
import { kunFetchPost } from '~/utils/kunFetch'
import { KunHeader } from '~/components/kun/Header'
import { KunNull } from '~/components/kun/Null'
import { GalgameCard } from '~/components/galgame/Card'
import { useSearchStore } from '~/store/searchStore'
import { SearchHistory } from './SearchHistory'
import { KunPagination } from '~/components/kun/Pagination'
import { SearchSuggestion } from './Suggestion'
import { SearchOption } from './Option'
import { useDebounce } from 'use-debounce'
import type { SearchSuggestionType } from '~/types/api/search'
import type { ChangeEvent, KeyboardEvent } from 'react'

const MAX_HISTORY_ITEMS = 10

export const SearchPage = () => {
  const [page, setPage] = useState(1)
  const [query, setQuery] = useState('')
  const [debouncedQuery] = useDebounce(query, 500)
  const [hasSearched, setHasSearched] = useState(false)
  const [patches, setPatches] = useState<GalgameCard[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedSuggestions, setSelectedSuggestions] = useState<
    SearchSuggestionType[]
  >([])

  const [showHistory, setShowHistory] = useState(false)
  const searchData = useSearchStore((state) => state.data)
  const setSearchData = useSearchStore((state) => state.setData)

  const addToHistory = (searchQuery: string) => {
    if (!searchQuery.trim()) return

    const newHistory = [
      searchQuery,
      ...searchData.searchHistory.filter((item) => item !== searchQuery)
    ].slice(0, MAX_HISTORY_ITEMS)

    setSearchData({ ...searchData, searchHistory: newHistory })
  }

  const handleSearch = async (currentPage = page, searchQuery = query) => {
    if (!selectedSuggestions.length) {
      return
    }

    setLoading(true)
    setShowHistory(false)
    setShowSuggestions(false)

    const { galgames, total } = await kunFetchPost<{
      galgames: GalgameCard[]
      total: number
    }>('/search', {
      queryString: JSON.stringify(selectedSuggestions),
      page: currentPage,
      limit: 12,
      searchOption: {
        searchInIntroduction: searchData.searchInIntroduction,
        searchInAlias: searchData.searchInAlias,
        searchInTag: searchData.searchInTag
      }
    })

    setPatches(galgames)
    setTotal(total)
    setHasSearched(true)
    setLoading(false)
    addToHistory(searchQuery)
  }

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value)
    if (!event.target.value.trim()) {
      setShowSuggestions(false)
      setShowHistory(true)
    } else {
      setShowSuggestions(true)
      setShowHistory(false)
    }
  }

  const handleInputFocus = () => {
    if (!query.trim()) {
      setShowHistory(true)
    } else {
      setShowSuggestions(true)
    }
  }

  const handleInputBlur = () => {
    setTimeout(() => {
      setShowHistory(false)
      setShowSuggestions(false)
    }, 100)
  }

  const handleRemoveChip = (nameToRemove: string) => {
    setSelectedSuggestions((prevSuggestions) =>
      prevSuggestions.filter((suggestion) => suggestion.name !== nameToRemove)
    )
  }

  const handleExecuteSearch = () => {
    if (!query.trim()) {
      return
    }
    setSelectedSuggestions((prev) => {
      const filtered = prev.filter((item) => item.name !== query.trim())
      return [...filtered, { type: 'keyword', name: query.trim() }]
    })
    setQuery('')
  }

  const handleKeyUp = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace') {
      if (!query.trim()) {
        setSelectedSuggestions((prev) => prev.slice(0, -1))
      }
    } else if (event.key === 'Enter') {
      handleExecuteSearch()
    }
  }

  useEffect(() => {
    if (selectedSuggestions.length) {
      handleSearch()
    } else {
      setPatches([])
      setHasSearched(false)
      setTotal(0)
      setLoading(false)
    }
  }, [selectedSuggestions])

  return (
    <div className="w-full my-4">
      <KunHeader
        name="搜索 Galgame"
        description="输入内容并点击搜索按钮以搜索 Galgame, 搜索设置默认搜索游戏标题和别名"
        headerEndContent={<SearchOption />}
      />

      <div className="relative flex gap-2 mb-6">
        <div className="flex flex-wrap items-center w-full gap-2 px-3 bg-default-100 rounded-large">
          {selectedSuggestions.map((suggestion, index) => (
            <Chip
              key={index}
              variant="flat"
              color={suggestion.type === 'keyword' ? 'primary' : 'secondary'}
              onClose={() => handleRemoveChip(suggestion.name)}
            >
              {suggestion.name}
            </Chip>
          ))}

          <input
            autoFocus
            className="placeholder-default-500 text-default-700 min-w-[120px] flex-grow bg-transparent outline-none"
            value={query}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onKeyUp={(e) => handleKeyUp(e)}
            placeholder="输入内容, 点击按钮或回车创建关键词, 支持使用 VNDB ID 搜索"
          />
        </div>

        {showSuggestions && (
          <SearchSuggestion
            query={debouncedQuery}
            setQuery={setQuery}
            setSelectedSuggestions={setSelectedSuggestions}
          />
        )}

        <SearchHistory
          showHistory={showHistory}
          setSelectedSuggestions={setSelectedSuggestions}
          setShowHistory={setShowHistory}
        />

        <Button color="primary" size="lg" onPress={handleExecuteSearch}>
          搜索
        </Button>
      </div>

      {loading ? (
        <KunLoading hint="正在搜索中..." />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2 mx-auto mb-8 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {patches.map((pa) => (
              <GalgameCard key={pa.id} patch={pa} />
            ))}
          </div>

          {total > 12 && (
            <div className="flex justify-center">
              <KunPagination
                total={Math.ceil(total / 12)}
                page={page}
                onPageChange={(newPage) => {
                  setPage(newPage)
                  handleSearch(newPage)
                }}
                isLoading={loading}
              />
            </div>
          )}

          {hasSearched && patches.length === 0 && (
            <KunNull message="未找到相关内容, 请尝试使用游戏的日文原名搜索或打开 NSFW" />
          )}
        </>
      )}
    </div>
  )
}
