'use client'

import { useEffect, useState } from 'react'
import { Button, Input } from '@heroui/react'
import toast from 'react-hot-toast'
import { kunFetchPost } from '~/utils/kunFetch'
import { FetchPreview } from '~/components/edit/components/FetchPreview'
import type { PatchFormDataShape } from '~/components/edit/types'

interface SteamPreview {
  name: string
  aliases: {
    english?: string
    japanese?: string
    tchinese?: string
  }
  releaseDate: string
  tags: string[]
  developers: { name: string; link: string }[]
}

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
  const [preview, setPreview] = useState<SteamPreview | null>(null)

  useEffect(() => {
    setPreview(null)
  }, [data.steamId])

  const handleFetch = async () => {
    const rawInput = data.steamId.trim()
    if (!rawInput) {
      toast.error('Steam ID 不可为空')
      return
    }

    if (!/^\d+$/.test(rawInput)) {
      toast.error('Steam ID 必须为纯数字')
      return
    }

    try {
      toast('正在从 Steam 获取数据...')
      const result = await kunFetchPost<KunResponse<SteamPreview>>(
        '/edit/steam',
        { steamId: rawInput }
      )

      if (typeof result === 'string') {
        toast.error(result)
        return
      }

      if (!result?.name) {
        toast.error('未找到对应的 Steam 游戏')
        return
      }

      setPreview(result)

      const extraAliases = [
        result.aliases.japanese,
        result.aliases.english,
        result.aliases.tchinese
      ]
        .map((a) => a?.trim())
        .filter((a): a is string => !!a)

      const alias = [...new Set([...data.alias, ...extraAliases])]

      setData({
        ...data,
        alias,
        released: result.releaseDate || data.released
      })

      toast.success(`确认: ${result.name}`)
    } catch (error) {
      console.error(error)
      setPreview(null)
      toast.error('Steam API 请求失败, 请稍后重试')
    }
  }

  const getAliasChips = () => {
    if (!preview) return []
    return [
      preview.aliases.japanese,
      preview.aliases.english,
      preview.aliases.tchinese
    ].filter((a): a is string => !!a?.trim())
  }

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
      <div className="flex items-center text-sm">
        {data.steamId && (
          <Button
            className="mr-4"
            color="primary"
            size="sm"
            onPress={handleFetch}
          >
            获取 Steam 数据
          </Button>
        )}
      </div>
      {preview && (
        <FetchPreview
          fields={[
            { label: '游戏名', value: preview.name },
            { label: '别名', value: getAliasChips() },
            { label: '标签', value: preview.tags },
            { label: '发售日期', value: preview.releaseDate },
            {
              label: '开发商',
              value: preview.developers.map((d) => d.name)
            }
          ]}
        />
      )}
    </div>
  )
}
