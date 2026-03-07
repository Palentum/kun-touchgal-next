'use client'

import { Chip } from '@heroui/react'
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent
} from 'react'
import { createPortal } from 'react-dom'

interface Props {
  values: string[]
  onReorder: (nextValues: string[]) => void
  onRemove: (index: number) => void
}

interface DragState {
  alias: string
  pointerId: number
  startX: number
  startY: number
  pointerX: number
  pointerY: number
  offsetX: number
  offsetY: number
  width: number
  isDragging: boolean
}

const dragThreshold = 4

const moveItem = (values: string[], fromIndex: number, toIndex: number) => {
  const nextValues = [...values]
  const [movedValue] = nextValues.splice(fromIndex, 1)

  if (movedValue === undefined) {
    return values
  }

  nextValues.splice(toIndex, 0, movedValue)
  return nextValues
}

export const SortableAliasChips = ({
  values,
  onReorder,
  onRemove
}: Props) => {
  const [dragState, setDragState] = useState<DragState | null>(null)
  const dragStateRef = useRef<DragState | null>(null)
  const onReorderRef = useRef(onReorder)
  const valuesRef = useRef(values)

  useEffect(() => {
    valuesRef.current = values
  }, [values])

  useEffect(() => {
    onReorderRef.current = onReorder
  }, [onReorder])

  useEffect(() => {
    dragStateRef.current = dragState
  }, [dragState])

  const endDrag = useCallback(() => {
    dragStateRef.current = null
    setDragState(null)
  }, [])

  const getAliasAtPoint = useCallback(
    (clientX: number, clientY: number, draggingAlias: string) => {
      const elements = document.elementsFromPoint(clientX, clientY)

      for (const element of elements) {
        const aliasItem = (element as HTMLElement).closest<HTMLElement>(
          '[data-alias-value]'
        )
        const aliasValue = aliasItem?.dataset.aliasValue

        if (aliasValue && aliasValue !== draggingAlias) {
          return aliasValue
        }
      }

      return null
    },
    []
  )

  useEffect(() => {
    if (!dragState) {
      return
    }

    const handlePointerMove = (event: PointerEvent) => {
      const currentDragState = dragStateRef.current

      if (!currentDragState || event.pointerId !== currentDragState.pointerId) {
        return
      }

      event.preventDefault()

      const distance = Math.hypot(
        event.clientX - currentDragState.startX,
        event.clientY - currentDragState.startY
      )
      const nextState = {
        ...currentDragState,
        pointerX: event.clientX,
        pointerY: event.clientY,
        isDragging: currentDragState.isDragging || distance >= dragThreshold
      }

      dragStateRef.current = nextState
      setDragState(nextState)

      if (!nextState.isDragging) {
        return
      }

      const overAlias = getAliasAtPoint(
        event.clientX,
        event.clientY,
        nextState.alias
      )

      if (!overAlias) {
        return
      }

      const currentValues = valuesRef.current
      const fromIndex = currentValues.indexOf(nextState.alias)
      const toIndex = currentValues.indexOf(overAlias)

      if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
        return
      }

      const nextValues = moveItem(currentValues, fromIndex, toIndex)
      valuesRef.current = nextValues
      onReorderRef.current(nextValues)
    }

    const handlePointerEnd = (event: PointerEvent) => {
      const currentDragState = dragStateRef.current

      if (!currentDragState || event.pointerId !== currentDragState.pointerId) {
        return
      }

      endDrag()
    }

    document.body.style.userSelect = 'none'

    window.addEventListener('pointermove', handlePointerMove, {
      passive: false
    })
    window.addEventListener('pointerup', handlePointerEnd)
    window.addEventListener('pointercancel', handlePointerEnd)

    return () => {
      document.body.style.userSelect = ''
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerEnd)
      window.removeEventListener('pointercancel', handlePointerEnd)
    }
  }, [dragState?.pointerId, endDrag, getAliasAtPoint])

  const handlePointerDown =
    (alias: string) => (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.pointerType === 'mouse' && event.button !== 0) {
        return
      }

      if ((event.target as HTMLElement).closest('button')) {
        return
      }

      event.preventDefault()

      const rect = event.currentTarget.getBoundingClientRect()

      setDragState({
        alias,
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        pointerX: event.clientX,
        pointerY: event.clientY,
        offsetX: event.clientX - rect.left,
        offsetY: event.clientY - rect.top,
        width: rect.width,
        isDragging: false
      })
    }

  return (
    <>
      <div className="flex flex-wrap gap-2 mt-2">
        {values.map((alias, index) => {
          const isDragging = dragState?.alias === alias && dragState.isDragging

          return (
            <div
              key={alias}
              data-alias-value={alias}
              onPointerDown={handlePointerDown(alias)}
              className={`cursor-grab select-none touch-none active:cursor-grabbing ${
                isDragging ? 'opacity-0' : ''
              }`}
            >
              <Chip
                onClose={() => onRemove(index)}
                variant="flat"
                className="h-8"
              >
                {alias}
              </Chip>
            </div>
          )
        })}
      </div>

      {dragState?.isDragging
        ? createPortal(
            <div
              aria-hidden
              className="pointer-events-none fixed z-50"
              style={{
                left: dragState.pointerX - dragState.offsetX,
                top: dragState.pointerY - dragState.offsetY,
                width: dragState.width
              }}
            >
              <Chip variant="flat" className="h-8 opacity-90 shadow-lg">
                {dragState.alias}
              </Chip>
            </div>,
            document.body
          )
        : null}
    </>
  )
}
