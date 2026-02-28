'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { Modal } from '@heroui/modal'
import { Button } from '@heroui/button'
import { Plus } from 'lucide-react'
import Masonry from 'react-masonry-css'
import { kunFetchGet } from '~/utils/kunFetch'
import { KunNull } from '~/components/kun/Null'
import { RatingCard } from './RatingCard'
import { RatingCardSkeleton } from './RatingCardSkeleton'
import { RatingModal } from './RatingModal'
import { useDisclosure } from '@heroui/react'
import { useUserStore } from '~/store/userStore'
import type {
  KunPatchRating,
  KunPatchRatingResponse
} from '~/types/api/galgame'

interface Props {
  id: number
}

const RATINGS_PER_PAGE = 24

export const Ratings = ({ id }: Props) => {
  const [ratings, setRatings] = useState<KunPatchRating[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const user = useUserStore((state) => state.user)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  const fetchRatings = useCallback(
    async (pageNum: number, reset = false) => {
      if (loading) return

      setLoading(true)
      const res = await kunFetchGet<KunPatchRatingResponse>('/patch/rating', {
        patchId: Number(id),
        page: pageNum,
        limit: RATINGS_PER_PAGE
      })

      if (res && typeof res !== 'string') {
        if (reset) {
          setRatings(res.ratings)
        } else {
          setRatings((prev) => [...prev, ...res.ratings])
        }
        setTotal(res.total)
        setHasMore(res.ratings.length === RATINGS_PER_PAGE)
      }
      setLoading(false)
    },
    [id, loading]
  )

  useEffect(() => {
    if (!user.uid) return
    fetchRatings(1, true)
  }, [id, user.uid])

  useEffect(() => {
    if (!loadMoreRef.current || !hasMore || loading) return

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          setPage((prev) => prev + 1)
        }
      },
      { threshold: 0.1 }
    )

    observerRef.current.observe(loadMoreRef.current)

    return () => {
      observerRef.current?.disconnect()
    }
  }, [hasMore, loading])

  useEffect(() => {
    if (page > 1) {
      fetchRatings(page)
    }
  }, [page])

  const handleCreated = (rating?: KunPatchRating) => {
    if (rating) {
      setRatings((prev) => [rating, ...prev])
      setTotal((prev) => prev + 1)
    }
  }

  const handlePatchUpdated = (rating: KunPatchRating) => {
    setRatings((prev) => prev.map((r) => (r.id === rating.id ? rating : r)))
  }

  const handleDeleted = (ratingId: number) => {
    setRatings((prev) => prev.filter((r) => r.id !== ratingId))
    setTotal((prev) => prev - 1)
  }

  if (!user.uid) {
    return <KunNull message="请登陆后查看游戏评价" />
  }

  const breakpointColumns = {
    default: 3,
    1024: 2,
    640: 1
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          color="primary"
          variant="flat"
          startContent={<Plus className="size-4" />}
          onPress={onOpen}
        >
          发布评价
        </Button>
      </div>

      <Masonry
        breakpointCols={breakpointColumns}
        className="flex w-auto -ml-4"
        columnClassName="pl-4 bg-clip-padding"
      >
        {ratings.map((rating) => (
          <div key={rating.id} className="mb-4">
            <RatingCard
              rating={rating}
              patchId={id}
              onRatingUpdated={handlePatchUpdated}
              onDeleted={handleDeleted}
            />
          </div>
        ))}
      </Masonry>

      {loading && (
        <Masonry
          breakpointCols={breakpointColumns}
          className="flex w-auto -ml-4"
          columnClassName="pl-4 bg-clip-padding"
        >
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={`skeleton-${index}`} className="mb-4">
              <RatingCardSkeleton />
            </div>
          ))}
        </Masonry>
      )}

      <div ref={loadMoreRef} className="w-full h-4" />

      {!ratings.length && !loading && <KunNull message="这个游戏还没有评价" />}

      {!hasMore && ratings.length > 0 && (
        <p className="text-center text-default-500 text-sm">
          已加载全部 {total} 条评价
        </p>
      )}

      <Modal
        isOpen={isOpen}
        onClose={onClose}
        isDismissable={false}
        isKeyboardDismissDisabled={true}
      >
        <RatingModal
          isOpen={isOpen}
          onClose={onClose}
          patchId={id}
          onSuccess={handleCreated}
        />
      </Modal>
    </div>
  )
}
