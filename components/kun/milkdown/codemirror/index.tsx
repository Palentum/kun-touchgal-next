import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { createCodeMirrorState, createCodeMirrorView } from './setup'
import type { RefObject } from 'react'

export interface CodemirrorProps {
  content: string
  onChange: (getString: () => string) => void
  lock: RefObject<boolean>
}

export interface CodemirrorRef {
  update: (markdown: string) => void
}

export const Codemirror = forwardRef<CodemirrorRef, CodemirrorProps>(
  ({ content, onChange, lock }, ref) => {
    const divRef = useRef<HTMLDivElement>(null)
    const editorRef = useRef<ReturnType<typeof createCodeMirrorView>>(null)

    useEffect(() => {
      if (!divRef.current) {
        return
      }

      console.log(11111111111)

      const editor = createCodeMirrorView({
        root: divRef.current,
        onChange,
        lock,
        content
      })
      editorRef.current = editor

      return () => {
        editor.destroy()
      }
    }, [onChange, content, lock])

    useImperativeHandle(ref, () => ({
      update: (content: string) => {
        const { current } = editorRef
        if (!current) return

        const state = createCodeMirrorState({ onChange, lock, content })
        current.setState(state)
      }
    }))

    return <div className="h-full min-h-64" ref={divRef} />
  }
)

Codemirror.displayName = 'Codemirror'
