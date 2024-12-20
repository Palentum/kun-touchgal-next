'use client'

import { Editor } from '~/components/kun/milkdown/PatchEditor'
import { useCreatePatchStore } from '~/store/editStore'
import { markdownToText } from '~/utils/markdownToText'

interface Props {
  errors: string | undefined
}

export const PatchIntroduction = ({ errors }: Props) => {
  const { data } = useCreatePatchStore()
  return (
    <div className="space-y-2">
      <h2 className="text-xl">游戏介绍 (可选)</h2>
      <p className="text-small text-default-500">
        游戏介绍涉及页面的 SEO, 建议填写 100 字以上
      </p>
      {errors && <p className="text-xs text-danger-500">{errors}</p>}
      <Editor storeName="patchCreate" />
      <p className="text-small text-default-500">
        字数: {markdownToText(data.introduction).length}
      </p>
    </div>
  )
}
