'use client'

import { Editor } from '~/components/kun/milkdown/PatchEditor'

interface Props {
  errors: string | undefined
}

export const PatchIntroduction = ({ errors }: Props) => {
  return (
    <div className="space-y-2">
      <h2 className="text-xl">四、游戏介绍</h2>
      {errors && <p className="text-xs text-danger-500">{errors}</p>}
      <Editor storeName="patchCreate" />
    </div>
  )
}
