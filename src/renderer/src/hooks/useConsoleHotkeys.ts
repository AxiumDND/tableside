import { useEffect, useRef } from 'react'

export interface ConsoleHotkeyHandlers {
  /** Alt+Left / mouse "back" button. */
  onBack: () => void
  /** Alt+Right / mouse "forward" button. */
  onNext: () => void
  /** Alt+S — show the selected art to players. */
  onShowArt: () => void
  /** Alt+I (Shift+Alt+I includes secrets) — show the open note as a handout. */
  onShowHandout: (includeSecrets: boolean) => void
  /** Alt+X — clear the player screen. */
  onClearPlayer: () => void
  /** Alt+T — advance the combat turn. */
  onAdvanceTurn: () => void
}

function isTyping(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
  )
}

/**
 * Global table hotkeys for the DM console. Handlers are read through a ref so
 * the listeners are registered once but always call the latest closures — no
 * stale state and no re-subscribing on every render.
 */
export function useConsoleHotkeys(handlers: ConsoleHotkeyHandlers): void {
  const ref = useRef(handlers)
  ref.current = handlers

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (isTyping(e.target)) return
      if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault()
        ref.current.onBack()
        return
      }
      if (e.altKey && e.key === 'ArrowRight') {
        e.preventDefault()
        ref.current.onNext()
        return
      }
      if (!(e.altKey && !e.ctrlKey && !e.metaKey)) return
      const key = e.key.toLowerCase()
      if (key === 's') {
        e.preventDefault()
        ref.current.onShowArt()
        return
      }
      if (key === 'i') {
        e.preventDefault()
        ref.current.onShowHandout(e.shiftKey)
        return
      }
      if (key === 'x') {
        e.preventDefault()
        ref.current.onClearPlayer()
        return
      }
      if (key === 't') {
        e.preventDefault()
        ref.current.onAdvanceTurn()
      }
    }
    const onMouse = (e: MouseEvent): void => {
      if (e.button === 3) {
        e.preventDefault()
        ref.current.onBack()
        return
      }
      if (e.button === 4) {
        e.preventDefault()
        ref.current.onNext()
      }
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('mouseup', onMouse)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('mouseup', onMouse)
    }
  }, [])
}
