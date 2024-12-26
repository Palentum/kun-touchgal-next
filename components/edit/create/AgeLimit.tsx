'use client'

import { Switch } from '@nextui-org/react'
import { useCreatePatchStore } from '~/store/editStore'
import { GALGAME_AGE_LIMIT_MAP } from '~/constants/galgame'

interface Props {
  errors: string | undefined
}

export const AgeLimit = ({ errors }: Props) => {
  const { data, setData } = useCreatePatchStore()

  return (
    <div className="space-y-2">
      <h2 className="text-xl">游戏分级</h2>
      <Switch
        defaultSelected
        color="danger"
        size="lg"
        isSelected={data.ageLimit === 'nsfw'}
        onValueChange={(value) => {
          if (value) {
            setData({ ...data, ageLimit: 'nsfw' })
          } else {
            setData({ ...data, ageLimit: 'safe' })
          }
        }}
      >
        {GALGAME_AGE_LIMIT_MAP[data.ageLimit]}
      </Switch>

      {errors && <p className="text-xs text-danger-500">{errors}</p>}
    </div>
  )
}
