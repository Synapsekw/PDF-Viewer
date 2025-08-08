import { useEffect } from 'react'
import { createEventBus } from '@/features/analytics/eventBus'
import type { SelectionEvent } from './types'

const bus = createEventBus<SelectionEvent>()

export function emitSelection(ev: SelectionEvent) {
  bus.emit(ev)
}

export function useOnSelection(handler: (ev: SelectionEvent) => void) {
  useEffect(() => bus.on(handler), [handler])
}


