'use client'

import { Input } from '@heroui/react'
import type { PatchFormDataShape } from '~/components/edit/types'

interface Props<T extends PatchFormDataShape> {
  errors?: string
  data: T
  setData: (data: T) => void
}

export const BangumiInput = <T extends PatchFormDataShape>({
  errors,
  data,
  setData
}: Props<T>) => {
  return (
    <div className="w-full space-y-2">
      <h2 className="text-xl">Bangumi ID (可选)</h2>
      <Input
        variant="underlined"
        labelPlacement="outside"
        placeholder="请输入 Bangumi 条目 ID, 例如 172612"
        value={data.bangumiId}
        onChange={(e) => setData({ ...data, bangumiId: e.target.value })}
        isInvalid={!!errors}
        errorMessage={errors}
      />
    </div>
  )
}
