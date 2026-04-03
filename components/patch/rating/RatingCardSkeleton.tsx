'use client'

import { Card, CardBody } from '@heroui/card'
import { Skeleton } from '@heroui/skeleton'

export const RatingCardSkeleton = () => {
  return (
    <Card className="w-full">
      <CardBody className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <Skeleton className="rounded-full w-10 h-10" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-4 w-24 rounded" />
              <div className="flex gap-1.5">
                <Skeleton className="h-3 w-16 rounded" />
                <Skeleton className="h-5 w-14 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            </div>
          </div>
          <Skeleton className="h-7 w-11 rounded-md" />
        </div>

        <div className="space-y-2">
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-4/5 rounded" />
          <Skeleton className="h-4 w-3/5 rounded" />
        </div>

        <div className="flex gap-2">
          <Skeleton className="h-8 w-16 rounded" />
        </div>
      </CardBody>
    </Card>
  )
}
