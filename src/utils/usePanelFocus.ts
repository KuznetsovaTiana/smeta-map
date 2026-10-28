import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'

/** Неперекрывающая панель: фокус при открытии, Escape и возврат к источнику. */
export function usePanelFocus(ref: RefObject<HTMLElement | null>, entityId: string, onClose: () => void) {
  const close = useRef(onClose)
  useEffect(() => { close.current = onClose }, [onClose])
  useEffect(() => {
    const panel = ref.current
    if (!panel) return
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    panel.focus({ preventScroll: true })
    const frame = requestAnimationFrame(() => panel.scrollIntoView({ block: 'nearest' }))
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        close.current()
      }
    }
    panel.addEventListener('keydown', onKey)
    return () => {
      cancelAnimationFrame(frame)
      panel.removeEventListener('keydown', onKey)
      if (previous?.isConnected && (panel.contains(document.activeElement) || document.activeElement === document.body)) {
        previous.focus({ preventScroll: true })
      }
    }
  }, [entityId, ref])
}
