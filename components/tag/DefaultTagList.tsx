'use client'

import { TagList } from './TagList'
import { KunPagination } from '~/components/kun/Pagination'
import type { Tag as TagType } from '~/types/api/tag'

interface DefaultTagListProps {
  tags: TagType[]
  loading: boolean
  searching: boolean
  total: number
  page: number
  onPageChange: (page: number) => void
}

export const DefaultTagList = ({
  tags,
  loading,
  searching,
  total,
  page,
  onPageChange
}: DefaultTagListProps) => {
  return (
    <div className="space-y-8">
      <TagList tags={tags} loading={loading} searching={searching} />

      {total > 100 && (
        <div className="flex justify-center">
          <KunPagination
            total={Math.ceil(total / 100)}
            page={page}
            onPageChange={onPageChange}
            isLoading={loading}
          />
        </div>
      )}
    </div>
  )
}
