'use client'

import { useState } from 'react'
import { Card, CardBody, CardHeader, Input, Link } from '@nextui-org/react'
import { useCreatePatchStore } from '~/store/editStore'
import { VNDBInput } from './VNDBInput'
import { AliasInput } from './AliasInput'
import { BannerImage } from './BannerImage'
import { PublishButton } from './PublishButton'
import { PatchIntroduction } from './PatchIntroduction'
import { ContentLimit } from './ContentLimit'
import type { CreatePatchRequestData } from '~/store/editStore'

export const CreatePatch = () => {
  const { data, setData } = useCreatePatchStore()
  const [errors, setErrors] = useState<
    Partial<Record<keyof CreatePatchRequestData, string>>
  >({})

  return (
    <form className="w-full mx-auto">
      <Card className="w-full">
        <CardHeader className="flex gap-3">
          <div className="flex flex-col">
            <h1 className="text-2xl">创建新游戏</h1>
          </div>
        </CardHeader>
        <CardBody className="mt-4 space-y-12">
          <VNDBInput errors={errors.vndbId} />

          <div>
            <h2 className="text-xl">游戏名称 (必须)</h2>
            <Input
              isRequired
              variant="underlined"
              labelPlacement="outside"
              placeholder="输入游戏名称, 这会作为游戏的标题"
              value={data.name}
              onChange={(e) => setData({ ...data, name: e.target.value })}
              isInvalid={!!errors.name}
              errorMessage={errors.name}
            />
          </div>

          <BannerImage errors={errors.banner} />

          <PatchIntroduction errors={errors.banner} />

          <AliasInput errors={errors.alias} />

          <ContentLimit errors={errors.contentLimit} />

          <PublishButton setErrors={setErrors} />
        </CardBody>
      </Card>
    </form>
  )
}
