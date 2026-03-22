'use client'

import { useEffect, useState } from 'react'
import { Button, Input } from '@heroui/react'
import toast from 'react-hot-toast'
import { kunFetchPost } from '~/utils/kunFetch'
import { FetchPreview } from '~/components/edit/components/FetchPreview'
import type { PatchFormDataShape } from '~/components/edit/types'

interface BangumiPreview {
  name: string
  nameCn: string
  tags: string[]
  developers: string[]
}

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
  const [preview, setPreview] = useState<BangumiPreview | null>(null)

  useEffect(() => {
    setPreview(null)
  }, [data.bangumiId])

  const handleFetch = async () => {
    const rawInput = data.bangumiId.trim()
    if (!rawInput) {
      toast.error('Bangumi ID 不可为空')
      return
    }

    if (!/^\d+$/.test(rawInput)) {
      toast.error('Bangumi ID 必须为纯数字')
      return
    }

    try {
      toast('正在从 Bangumi 获取数据...')
      const result = await kunFetchPost<KunResponse<BangumiPreview>>(
        '/edit/bangumi',
        { bangumiId: rawInput }
      )

      if (typeof result === 'string') {
        toast.error(result)
        return
      }

      const displayName = result.nameCn || result.name
      if (!displayName) {
        toast.error('未找到对应的 Bangumi 条目')
        return
      }

      setPreview(result)

      const extraAliases = [result.name, result.nameCn]
        .map((n) => n?.trim())
        .filter((n): n is string => !!n)
      const alias = [...new Set([...data.alias, ...extraAliases])]

      setData({ ...data, alias })

      toast.success(`确认: ${displayName}`)
    } catch (error) {
      console.error(error)
      setPreview(null)
      toast.error('Bangumi API 请求失败, 请稍后重试')
    }
  }

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
      <div className="flex items-center text-sm">
        {data.bangumiId && (
          <Button
            className="mr-4"
            color="primary"
            size="sm"
            onPress={handleFetch}
          >
            获取 Bangumi 数据
          </Button>
        )}
      </div>
      {preview && (
        <FetchPreview
          fields={[
            { label: '名称', value: preview.name },
            { label: '中文名', value: preview.nameCn },
            { label: '标签', value: preview.tags },
            { label: '开发商', value: preview.developers }
          ]}
        />
      )}
    </div>
  )
}
