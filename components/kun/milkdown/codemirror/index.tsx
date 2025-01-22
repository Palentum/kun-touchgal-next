import {
  forwardRef,
  useLayoutEffect,
  useImperativeHandle,
  useRef,
  useState
} from 'react'
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
  ({ content, onChange }, ref) => {
    const [focus, setFocus] = useState<'cm' | null>(null)
    const divRef = useRef<HTMLDivElement>(null)
    const editorRef = useRef<ReturnType<typeof createCodeMirrorView>>(null)

    useLayoutEffect(() => {
      if (!divRef.current) {
        return
      }

      const editor = createCodeMirrorView({
        root: divRef.current,
        onChange,
        setFocus,
        content
      })
      editorRef.current = editor

      return () => {
        editor.destroy()
      }
    }, [onChange, content, focus])

    useImperativeHandle(ref, () => ({
      update: (content: string) => {
        const { current } = editorRef
        if (!current) return

        const state = createCodeMirrorState({
          onChange,
          setFocus,
          content
        })
        current.setState(state)
      }
    }))

    return <div className="h-full min-h-64" ref={divRef} />
  }
)
