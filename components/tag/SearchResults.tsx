'use client'

import { Pagination } from '@nextui-org/react'
import { KunLoading } from '~/components/kun/Loading'
import { GalgameCard } from '~/components/galgame/Card'

interface SearchResultsProps {
  galgames: GalgameCard[]
  loading: boolean
  total: number
  page: number
  onPageChange: (page: number) => void
}

export const SearchResults = ({
  galgames,
  loading,
  total,
  page,
  onPageChange
}: SearchResultsProps) => {
  if (loading) {
    return <KunLoading hint="正在搜索标签数据..." />
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-2 mx-auto mb-8 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {galgames.map((game) => (
          <GalgameCard key={game.id} patch={game} />
        ))}
      </div>

      {total > 10 && (
        <div className="flex justify-center">
          <Pagination
            total={Math.ceil(total / 10)}
            page={page}
            onChange={onPageChange}
            showControls
            color="primary"
            size="lg"
          />
        </div>
      )}
    </div>
  )
}
