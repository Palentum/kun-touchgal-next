'use client'

import { useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import {
  Chip,
  Tooltip,
  Popover,
  PopoverTrigger,
  PopoverContent
} from '@heroui/react'
import {
  KUN_GALGAME_RATING_RECOMMEND_CONST,
  KUN_GALGAME_RATING_RECOMMEND_MAP
} from '~/constants/galgame'
import type { Patch } from '~/types/api/patch'
import { KunRating } from '~/components/kun/Rating'
import { KunLoading } from '~/components/kun/Loading'

const RatingDistributionChart = dynamic(
  () =>
    import('./RatingDistributionChart').then(
      (mod) => mod.RatingDistributionChart
    ),
  {
    ssr: false,
    loading: () => <KunLoading hint="加载分布图" />
  }
)

interface Props {
  patch: Patch
}

export const PatchRatingSummaryBadge = ({ patch }: Props) => {
  const avg = patch.ratingSummary.average
  const count = patch.ratingSummary.count
  const histogram = patch.ratingSummary.histogram

  const [popoverOpen, setPopoverOpen] = useState(false)

  const chartData = useMemo(() => {
    const base = Array.from({ length: 10 }, (_, i) => ({
      score: i + 1,
      count: 0
    }))
    if (!histogram) {
      return base
    }

    const merged = [...base]
    for (const h of histogram) {
      if (h.score >= 1 && h.score <= 10) merged[h.score - 1].count = h.count
    }

    return merged
  }, [histogram])

  const rec = patch.ratingSummary.recommend || {
    strong_no: 0,
    no: 0,
    neutral: 0,
    yes: 0,
    strong_yes: 0
  }

  return (
    <div className="flex items-center gap-3">
      <KunRating readOnly valueMax={10} value={avg} />
      <span className="text-warning font-bold text-xl">{avg}</span>
      <span className="w-px h-4 bg-default-200" />

      <Popover
        placement="bottom-end"
        offset={8}
        isOpen={popoverOpen}
        onOpenChange={setPopoverOpen}
      >
        <PopoverTrigger>
          <div className="flex">
            <Tooltip content="点击查看统计分布图">
              <span className="cursor-pointer text-default-500 text-sm">
                查看评分分布
              </span>
            </Tooltip>
          </div>
        </PopoverTrigger>
        <PopoverContent className="p-4 w-[320px]">
          <div className="flex items-center gap-3 justify-between mb-2">
            <div className="text-base font-semibold">评分分布图</div>
            <div className="text-xs text-default-500">共 {count} 人评分</div>
          </div>
          <div className="w-full h-52">
            {popoverOpen && <RatingDistributionChart data={chartData} />}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {KUN_GALGAME_RATING_RECOMMEND_CONST.map((k) => {
              const color =
                k === 'strong_no'
                  ? 'danger'
                  : k === 'no'
                    ? 'warning'
                    : k === 'neutral'
                      ? 'default'
                      : k === 'yes'
                        ? 'success'
                        : 'secondary'
              return (
                <Chip key={k} size="sm" color={color as any} variant="flat">
                  {KUN_GALGAME_RATING_RECOMMEND_MAP[k]} {rec[k] ?? 0}
                </Chip>
              )
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
