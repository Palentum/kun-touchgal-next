'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input, Button, Checkbox, Link } from '@nextui-org/react'
import { KunLoading } from '~/components/kun/Loading'
import { Search } from 'lucide-react'
import { kunFetchPost } from '~/utils/kunFetch'
import { KunHeader } from '~/components/kun/Header'
import { KunNull } from '~/components/kun/Null'
import { GalgameCard } from '~/components/galgame/Card'
import { useSearchStore } from '~/store/searchStore'
import { SearchHistory } from './SearchHistory'
import { KunPagination } from '~/components/kun/Pagination'
import { SearchSuggestion } from './Suggestion'

const MAX_HISTORY_ITEMS = 10

interface SearchSuggestion {
  type: 'keyword' | 'tag'
  name: string
}

export const SearchPage = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentPage = Number(searchParams.get('page') || '1')

  const [page, setPage] = useState(currentPage)
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [hasSearched, setHasSearched] = useState(false)
  const [patches, setPatches] = useState<GalgameCard[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)

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
    if (!searchQuery.trim()) return

    setLoading(true)
    setShowHistory(false)
    setShowSuggestions(false)

    const { galgames, total } = await kunFetchPost<{
      galgames: GalgameCard[]
      total: number
    }>('/search', {
      query: searchQuery.split(' ').filter((term) => term.length > 0),
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

    const params = new URLSearchParams()
    params.set('q', searchQuery)
    params.set('page', currentPage.toString())
    router.push(`/search?${params.toString()}`)

    setLoading(false)
    addToHistory(searchQuery)
  }

  const handleInputBlur = () => {
    setTimeout(() => {
      setShowHistory(false)
      setShowSuggestions(false)
    }, 100)
  }

  return (
    <div className="w-full my-4">
      <KunHeader
        name="搜索 Galgame"
        description="输入内容并点击搜索按钮以搜索 Galgame"
      />

      <div className="mb-8 space-y-4">
        <div className="relative flex gap-2">
          <div className="flex-1">
            <Input
              autoFocus
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setShowSuggestions(true)
                if (!e.target.value.trim()) {
                  setShowHistory(true)
                }
              }}
              onFocus={() => {
                if (!query.trim()) {
                  setShowHistory(true)
                } else {
                  setShowSuggestions(true)
                }
              }}
              onBlur={handleInputBlur}
              placeholder="使用空格分隔关键词, 支持使用 VNDB ID 搜索"
              size="lg"
              radius="lg"
              startContent={<Search className="text-default-400" />}
            />

            {showSuggestions && (
              <SearchSuggestion
                query={query}
                setQuery={setQuery}
                handleSearch={handleSearch}
              />
            )}

            <SearchHistory
              showHistory={showHistory}
              setShowHistory={setShowHistory}
              setQuery={setQuery}
            />
          </div>

          <Button color="primary" size="lg" onPress={() => handleSearch(1)}>
            搜索
          </Button>
        </div>

        <div className="text-sm text-default-500">
          搜索默认搜索游戏标题和别名, 您可以选择性的添加游戏属性进行搜索,
          您也可以
          <Link href="/tag" size="sm" underline="always">
            前往多标签搜索
          </Link>
        </div>

        <div className="flex flex-wrap gap-3">
          <Checkbox
            isSelected={searchData.searchInIntroduction}
            onValueChange={(checked) =>
              setSearchData({ ...searchData, searchInIntroduction: checked })
            }
          >
            包含简介
          </Checkbox>
          <Checkbox
            isSelected={searchData.searchInAlias}
            onValueChange={(checked) =>
              setSearchData({ ...searchData, searchInAlias: checked })
            }
          >
            包含别名
          </Checkbox>
          <Checkbox
            isSelected={searchData.searchInTag}
            onValueChange={(checked) =>
              setSearchData({ ...searchData, searchInTag: checked })
            }
          >
            包含标签
          </Checkbox>
        </div>
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
