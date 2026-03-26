'use client'

import { useEffect, useState } from 'react'
import { Chip, Textarea } from '@heroui/react'
import type { PatchFormDataShape } from '~/components/edit/types'
import {
  normalizeStringArray,
  parseCommaSeparatedStringArray
} from '~/utils/normalizeStringArray'

interface TagEntry {
  name: string
  source: string
}

const SOURCE_COLORS: Record<string, 'secondary' | 'success' | 'warning'> = {
  VNDB: 'secondary',
  Bangumi: 'success',
  Steam: 'warning'
}

const collectExternalTags = (data: PatchFormDataShape): TagEntry[] => {
  const entries: TagEntry[] = []

  for (const name of data.vndbTags) {
    if (name.trim()) entries.push({ name: name.trim(), source: 'VNDB' })
  }
  for (const name of data.bangumiTags) {
    if (name.trim()) entries.push({ name: name.trim(), source: 'Bangumi' })
  }
  for (const name of data.steamTags) {
    if (name.trim()) entries.push({ name: name.trim(), source: 'Steam' })
  }

  return entries.filter(
    (entry, i, arr) => arr.findIndex((e) => e.name === entry.name) === i
  )
}

interface Props {
  data: PatchFormDataShape
  saveTag: (tag: string[]) => void
  errors?: string
}

export const BatchTag = ({ data, saveTag, errors }: Props) => {
  const externalTags = collectExternalTags(data)
  const [manualTagInput, setManualTagInput] = useState(() =>
    normalizeStringArray(data.tag).join(',')
  )

  useEffect(() => {
    const normalizedTags = normalizeStringArray(data.tag)
    const currentInputTags = parseCommaSeparatedStringArray(manualTagInput)

    if (normalizedTags.join(',') !== currentInputTags.join(',')) {
      setManualTagInput(normalizedTags.join(','))
    }
  }, [data.tag, manualTagInput])

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h2 className="text-xl">游戏标签 (可选)</h2>
        {errors && <p className="text-xs text-danger-500">{errors}</p>}
      </div>

      {externalTags.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-default-500">
            以下标签来自外部数据源，将在提交时自动关联
          </p>
          <div className="flex flex-wrap gap-2">
            {externalTags.map((entry) => (
              <Chip
                key={`${entry.source}-${entry.name}`}
                variant="flat"
                size="sm"
                color={SOURCE_COLORS[entry.source]}
              >
                {entry.name}
                <span className="ml-1 opacity-60">({entry.source})</span>
              </Chip>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <p className="text-sm text-default-500">手动添加标签</p>
        <Textarea
          placeholder="批量添加标签, 每个标签需要使用英语逗号 ( , ) 分隔"
          value={manualTagInput}
          onChange={(e) => {
            const input = e.target.value
            setManualTagInput(input)
            saveTag(parseCommaSeparatedStringArray(input))
          }}
          className="w-full"
          minRows={3}
        />
        <p className="text-sm text-default-500">
          无该标签时将会自动创建标签, 并且会根据标签名自动增删游戏的标签以及计数
        </p>
      </div>
    </div>
  )
}
