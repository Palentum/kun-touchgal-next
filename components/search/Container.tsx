'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@nextui-org/input'
import { Checkbox, Link } from '@nextui-org/react'
import { Pagination } from '@nextui-org/pagination'
import { KunLoading } from '~/components/kun/Loading'
import { KunMasonryGrid } from '~/components/kun/MasonryGrid'
import { Search } from 'lucide-react'
import { useDebounce } from 'use-debounce'
import { kunFetchPost } from '~/utils/kunFetch'
import { KunHeader } from '~/components/kun/Header'
import { KunNull } from '~/components/kun/Null'
import { SearchCard } from './Card'
import { motion } from 'framer-motion'
import { cardContainer, cardItem } from '~/motion/card'
import { useSearchStore } from '~/store/searchStore'
import { SearchHistory } from './SearchHistory'

const MAX_HISTORY_ITEMS = 10

export const SearchPage = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentPage = Number(searchParams.get('page') || '1')

  const [page, setPage] = useState(currentPage)
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [debouncedQuery] = useDebounce(query, 500)
  const [hasSearched, setHasSearched] = useState(false)
  const [patches, setPatches] = useState<GalgameCard[]>([])
  const [total, setTotal] = useState(0)

  const [showHistory, setShowHistory] = useState(false)
  const searchData = useSearchStore((state) => state.data)
  const setSearchData = useSearchStore((state) => state.setData)

  useEffect(() => {
    if (debouncedQuery) {
      handleSearch()
    } else {
      setPatches([])
      setTotal(0)
      setHasSearched(false)
    }
  }, [
    debouncedQuery,
    searchData.searchInAlias,
    searchData.searchInIntroduction,
    searchData.searchInTag
  ])

  const addToHistory = (searchQuery: string) => {
    if (!searchQuery.trim()) {
      return
    }

    const newHistory = [
      searchQuery,
      ...searchData.searchHistory.filter((item) => item !== searchQuery)
    ].slice(0, MAX_HISTORY_ITEMS)

    setSearchData({ ...searchData, searchHistory: newHistory })
  }

  const [loading, setLoading] = useState(false)
  const handleSearch = async () => {
    if (!query.trim()) {
      return
    }

    setLoading(true)
    addToHistory(query)
    setShowHistory(false)

    const { galgames, total } = await kunFetchPost<{
      galgames: GalgameCard[]
      total: number
    }>('/search', {
      query: query.split(' ').filter((term) => term.length > 0),
      page,
      limit: 10,
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
    params.set('q', query)
    params.set('page', page.toString())
    router.push(`/search?${params.toString()}`)

    setLoading(false)
  }

  useEffect(() => {
    handleSearch()
  }, [page])

  return (
    <div className="w-full my-4">
      <KunHeader name="搜索 Galgame" description="输入内容以自动搜索 Galgame" />

      <div className="mb-8 space-y-4">
        <div className="relative">
          <Input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setShowHistory(true)
            }}
            onFocus={() => setShowHistory(true)}
            onBlur={async () => {
              await new Promise((resolve) => {
                setTimeout(resolve, 100)
              })
              setShowHistory(false)
            }}
            placeholder="可以用空格分隔您的搜索关键字"
            size="lg"
            radius="lg"
            startContent={<Search className="text-default-400" />}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch()
              }
            }}
          />

          <SearchHistory
            showHistory={showHistory}
            setShowHistory={setShowHistory}
            setQuery={setQuery}
          />
        </div>

        <div className="text-sm text-default-500">
          搜索默认搜索游戏标题, 您可以选择性的添加游戏属性进行搜索, 您也可以
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
        <motion.div
          variants={cardContainer}
          initial="hidden"
          animate="show"
          className="space-y-6"
        >
          <KunMasonryGrid columnWidth={512} gap={24}>
            {patches.map((patch) => (
              <motion.div key={patch.id} variants={cardItem}>
                <SearchCard patch={patch} />
              </motion.div>
            ))}
          </KunMasonryGrid>

          {total > 10 && (
            <div className="flex justify-center">
              <Pagination
                total={Math.ceil(total / 10)}
                page={page}
                onChange={setPage}
                showControls
                size="lg"
                radius="lg"
                classNames={{
                  wrapper: 'gap-2',
                  item: 'w-10 h-10'
                }}
              />
            </div>
          )}

          {hasSearched && patches.length === 0 && (
            <KunNull message="未找到相关内容, 请尝试使用游戏的日文原名搜索或打开 NSFW" />
          )}
        </motion.div>
      )}
    </div>
  )
}
