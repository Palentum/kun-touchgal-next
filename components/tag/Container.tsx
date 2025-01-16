'use client'

import { useEffect, useState } from 'react'
import { useDebounce } from 'use-debounce'
import { Pagination } from '@nextui-org/pagination'
import { TagHeader } from './TagHeader'
import { SearchTags } from './SearchTag'
import { TagList } from './TagList'
import { kunFetchGet, kunFetchPost } from '~/utils/kunFetch'
import { useMounted } from '~/hooks/useMounted'
import type { Tag as TagType } from '~/types/api/tag'

interface Props {
  initialTags: TagType[]
  initialTotal: number
}

export const Container = ({ initialTags, initialTotal }: Props) => {
  const [tags, setTags] = useState<TagType[]>(initialTags)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(initialTotal)
  const [loading, setLoading] = useState(false)
  const isMounted = useMounted()

  const [query, setQuery] = useState('')
  const [debouncedQuery] = useDebounce(query, 500)
  const [searching, setSearching] = useState(false)
  const [suggestions, setSuggestions] = useState<TagType[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [galgames, setGalgames] = useState<any[]>([])

  const fetchTags = async () => {
    setLoading(true)
    const { tags, total } = await kunFetchGet<{
      tags: TagType[]
      total: number
    }>('/tag/all', {
      page: 1,
      limit: 100
    })
    setTags(tags)
    setTotal(total)
    setLoading(false)
  }

  const fetchSuggestions = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setSuggestions([])
      return
    }

    const response = await kunFetchPost<TagType[]>('/tag/search', {
      query: [searchQuery]
    })
    setSuggestions(response)
  }

  const fetchGalgamesWithTags = async () => {
    if (selectedTags.length === 0) {
      setGalgames([])
      return
    }

    setSearching(true)
    const response = await kunFetchPost<{
      galgames: GalgameCard[]
      total: number
    }>('/search/tag', {
      query: selectedTags,
      page: 1,
      limit: 10
    })
    setGalgames(response.galgames)
    setSearching(false)
  }

  useEffect(() => {
    if (!isMounted) return
    fetchTags()
  }, [page])

  useEffect(() => {
    if (debouncedQuery) {
      fetchSuggestions(debouncedQuery)
    } else {
      setSuggestions([])
    }
  }, [debouncedQuery])

  useEffect(() => {
    fetchGalgamesWithTags()
  }, [selectedTags])

  const handleTagSelect = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag])
    }
  }

  const handleTagRemove = (tag: string) => {
    setSelectedTags(selectedTags.filter((t) => t !== tag))
  }

  const handleSearch = () => {
    if (!query.trim()) return
    handleTagSelect(query.trim())
    setQuery('')
  }

  return (
    <div className="flex flex-col w-full my-4 space-y-8">
      <TagHeader setNewTag={(newTag) => setTags([newTag, ...initialTags])} />

      <SearchTags
        query={query}
        setQuery={setQuery}
        handleSearch={handleSearch}
        searching={searching}
        suggestions={suggestions}
        selectedTags={selectedTags}
        onTagSelect={handleTagSelect}
        onTagRemove={handleTagRemove}
      />

      {!searching && selectedTags.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {galgames.map((galgame) => (
            <div
              key={galgame.id}
              className="p-4 transition-shadow border rounded-lg shadow-sm hover:shadow-md"
            >
              <h3 className="text-lg font-semibold">{galgame.title}</h3>
              <p className="mt-2 text-sm text-gray-600">
                {galgame.description}
              </p>
            </div>
          ))}
        </div>
      )}

      {!searching && !selectedTags.length && (
        <TagList tags={tags} loading={loading} searching={searching} />
      )}

      {total > 100 && !query && !selectedTags.length && (
        <div className="flex justify-center">
          <Pagination
            total={Math.ceil(total / 100)}
            page={page}
            onChange={(newPage: number) => setPage(newPage)}
            showControls
            color="primary"
            size="lg"
          />
        </div>
      )}
    </div>
  )
}
