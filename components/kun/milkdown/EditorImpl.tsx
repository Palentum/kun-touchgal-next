'use client'

import { EditorProvider } from './EditorProvider'
import { MilkdownProvider } from '@milkdown/react'
import { ProsemirrorAdapterProvider } from '@prosemirror-adapter/react'

interface KunEditorImplProps {
  valueMarkdown: string
  saveMarkdown: (markdown: string) => void
  placeholder?: string
}

export const KunEditorImpl = (props: KunEditorImplProps) => {
  return (
    <MilkdownProvider>
      <ProsemirrorAdapterProvider>
        <EditorProvider {...props} />
      </ProsemirrorAdapterProvider>
    </MilkdownProvider>
  )
}

export default KunEditorImpl
