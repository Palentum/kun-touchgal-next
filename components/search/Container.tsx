'use client'

import { useEffect, useState } from 'react'
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
import { SearchInput } from './Input'
import type { SearchSuggestionType } from '~/types/api/search'

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
    <div className="relative w-full my-4">
      <KunHeader
        name="搜索 Galgame"
        description="输入内容并点击搜索按钮以搜索 Galgame, 搜索设置默认搜索游戏标题和别名, 支持使用 VNDB ID 搜索"
        headerEndContent={<SearchOption />}
      />

      <SearchInput
        query={query}
        setQuery={setQuery}
        setShowSuggestions={setShowSuggestions}
        selectedSuggestions={selectedSuggestions}
        setSelectedSuggestions={setSelectedSuggestions}
        setShowHistory={setShowHistory}
      />

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
