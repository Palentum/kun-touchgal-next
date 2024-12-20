'use client'

import { useEffect, useMemo, useState } from 'react'
import { locales, BlockNoteEditor, PartialBlock } from '@blocknote/core'
import { Theme, BlockNoteView } from '@blocknote/mantine'
import { useCreateBlockNote } from '@blocknote/react'
import { useTheme } from 'next-themes'
import { KunLoading } from '../Loading'
import { useCreatePatchStore } from '~/store/editStore'
import '~/styles/blocknote.scss'
import '@blocknote/mantine/style.css'
import '@blocknote/core/fonts/inter.css'

export default function Editor() {
  const getCreatePatchData = useCreatePatchStore((state) => state.getData)
  const setCreatePatchData = useCreatePatchStore((state) => state.setData)

  const [initialContent, setInitialContent] = useState<
    PartialBlock[] | undefined | 'loading'
  >('loading')

  const editor = useMemo(() => {
    if (initialContent === 'loading') {
      return undefined
    }

    return BlockNoteEditor.create({ initialContent, dictionary: locales.zh })
  }, [initialContent])

  if (editor === undefined) {
    return <KunLoading className="min-h-64" hint="正在加载编辑器" />
  }

  const { theme } = useTheme()

  return (
    <BlockNoteView
      editor={editor}
      theme={theme as Theme}
      className="blocknote"
    />
  )
}
