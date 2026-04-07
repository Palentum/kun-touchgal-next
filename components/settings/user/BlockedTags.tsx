'use client'

import { useEffect, useState } from 'react'
import { Card, CardBody, CardFooter, CardHeader } from '@heroui/card'
import { Chip } from '@heroui/chip'
import toast from 'react-hot-toast'
import { kunFetchDelete, kunFetchGet } from '~/utils/kunFetch'
import { useUserStore } from '~/store/userStore'
import type { Tag } from '~/types/api/tag'

interface UpdateBlockedTagResponse {
  blockedTagIds: number[]
}

export const BlockedTags = () => {
  const { user, setUser } = useUserStore((state) => state)
  const [blockedTags, setBlockedTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(false)
  const [updatingId, setUpdatingId] = useState(0)

  const syncBlockedTags = async () => {
    if (!user.uid) {
      return
    }

    setLoading(true)
    try {
      const response = await kunFetchGet<KunResponse<Tag[]>>(
        '/user/setting/blocked-tag'
      )
      if (typeof response === 'string') {
        toast.error(response)
      } else {
        setBlockedTags(response)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    syncBlockedTags()
  }, [user.uid])

  const handleUnblockTag = async (tag: Tag) => {
    if (!user.uid || updatingId) {
      return
    }

    setUpdatingId(tag.id)
    try {
      const response = await kunFetchDelete<
        KunResponse<UpdateBlockedTagResponse>
      >('/user/setting/blocked-tag', { tagId: tag.id })
      if (typeof response === 'string') {
        toast.error(response)
        return
      }

      setUser({ ...user, blockedTagIds: response.blockedTagIds })
      setBlockedTags((prev) => prev.filter((item) => item.id !== tag.id))
      toast.success(`已取消屏蔽标签「${tag.name}」`)
    } finally {
      setUpdatingId(0)
    }
  }

  return (
    <Card className="w-full text-sm">
      <CardHeader>
        <h2 className="text-xl font-medium">标签屏蔽</h2>
      </CardHeader>

      <CardBody className="space-y-4 py-0">
        <p>屏蔽某个标签后，带有该标签的游戏将不会出现在公开列表中。</p>

        <div className="space-y-2">
          <p className="text-default-500">已屏蔽标签</p>

          {loading ? (
            <p className="text-default-500">正在加载已屏蔽标签...</p>
          ) : blockedTags.length ? (
            <div className="flex flex-wrap gap-2">
              {blockedTags.map((tag) => (
                <Chip
                  key={tag.id}
                  color="danger"
                  variant="flat"
                  className="cursor-pointer"
                  onClick={() => handleUnblockTag(tag)}
                >
                  {tag.name}
                </Chip>
              ))}
            </div>
          ) : (
            <p className="text-default-500">您暂时没有屏蔽任何标签</p>
          )}
        </div>
      </CardBody>

      <CardFooter className="flex-wrap">
        <p className="text-default-500">
          点按已屏蔽标签即可取消屏蔽。如需新增屏蔽标签，请前往对应标签详情页操作。
        </p>
      </CardFooter>
    </Card>
  )
}
