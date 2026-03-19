'use client'

import { Input } from '@heroui/react'
import type { PatchFormDataShape } from '~/components/edit/types'

interface Props<T extends PatchFormDataShape> {
  errors?: string
  data: T
  setData: (data: T) => void
}

export const SteamInput = <T extends PatchFormDataShape>({
  errors,
  data,
  setData
}: Props<T>) => {
  return (
    <div className="w-full space-y-2">
      <h2 className="text-xl">Steam ID (可选)</h2>
      <Input
        variant="underlined"
        labelPlacement="outside"
        placeholder="请输入 Steam App ID, 例如 3655150"
        value={data.steamId}
        onChange={(e) => setData({ ...data, steamId: e.target.value })}
        isInvalid={!!errors}
        errorMessage={errors}
      />
    </div>
  )
}
