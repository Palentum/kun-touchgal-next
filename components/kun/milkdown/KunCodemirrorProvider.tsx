import { CodemirrorRef } from './codemirror/index'
import { Codemirror } from './codemirror/index'
import { useCallback, useRef } from 'react'
import { useCreatePatchStore } from '~/store/editStore'
import { useRewritePatchStore } from '~/store/rewriteStore'

import { FeatureToggleProvider } from './providers/FeatureToggleProvider'
import { InspectorProvider } from './providers/InspectorProvider'
import { ProseStateProvider } from './providers/ProseStateProvider'
import { ShareProvider } from './providers/ShareProvider'
import { compose } from './providers/compose'

const Provider = compose(
  FeatureToggleProvider,
  ProseStateProvider,
  ShareProvider,
  InspectorProvider
)

interface Props {
  storeName: 'patchCreate' | 'patchRewrite'
}

export const KunCodemirrorProvider = ({ storeName }: Props) => {
  const getCreatePatchData = useCreatePatchStore((state) => state.getData)
  const setCreatePatchData = useCreatePatchStore((state) => state.setData)
  const getRewritePatchData = useRewritePatchStore((state) => state.getData)
  const setRewritePatchData = useRewritePatchStore((state) => state.setData)

  const lockCodemirror = useRef(false)
  const codemirrorRef = useRef<CodemirrorRef>(null)

  const saveMarkdown = (markdown: string) => {
    if (storeName === 'patchCreate') {
      setCreatePatchData({ ...getCreatePatchData(), introduction: markdown })
    } else if (storeName === 'patchRewrite') {
      setRewritePatchData({ ...getRewritePatchData(), introduction: markdown })
    }
  }

  const getMarkdown = () => {
    if (storeName === 'patchCreate') {
      return getCreatePatchData().introduction
    } else if (storeName === 'patchRewrite') {
      return getRewritePatchData().introduction
    } else {
      return ''
    }
  }

  const onCodemirrorChange = useCallback((getCode: () => string) => {
    saveMarkdown(getCode())
  }, [])

  return (
    <div className="w-full min-h-64">
      <Provider>
        <Codemirror
          ref={codemirrorRef}
          content={getMarkdown()}
          onChange={onCodemirrorChange}
          lock={lockCodemirror}
        />
      </Provider>
    </div>
  )
}
