import { useEffect } from 'react'

export function useKeyboard(shortcuts) {
  useEffect(() => {
    function handleKey(e) {
      // Don't trigger when typing in inputs
      const tag = document.activeElement?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      shortcuts.forEach(({ key, ctrl, meta, action }) => {
        const ctrlMatch = ctrl ? (e.ctrlKey || e.metaKey) : true
        const metaMatch = meta ? e.metaKey : true
        if (e.key.toLowerCase() === key.toLowerCase() && ctrlMatch && metaMatch) {
          e.preventDefault()
          action()
        }
      })
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [shortcuts])
}