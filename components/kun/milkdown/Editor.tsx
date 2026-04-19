'use client'

import dynamic from 'next/dynamic'
import { KunLoading } from '~/components/kun/Loading'

interface KunEditorProps {
  valueMarkdown: string
  saveMarkdown: (markdown: string) => void
  placeholder?: string
}

const KunEditorImpl = dynamic(
  () => import('./EditorImpl').then((mod) => mod.KunEditorImpl),
  {
    ssr: false,
    loading: () => <KunLoading className="min-h-48" hint="正在加载编辑器" />
  }
)

export const KunEditor = (props: KunEditorProps) => {
  return <KunEditorImpl {...props} />
}
