import { useRef, useState, useEffect } from 'react'
import { CHEATING_DEBOUNCE_MS } from '@/constants/quiz'

export type QuizOpenModal = 'cheating' | 'fullscreen' | 'submitComplete'

/**
 * 부정행위 감지: visibilitychange, blur, fullscreen 해제, Escape/F11.
 * 디바운스 적용, 최대 3회까지 카운트.
 */
export function useCheatingDetection(
  isEnded: boolean,
  setOpenModal: (modal: QuizOpenModal | null) => void
) {
  const [cheatingCount, setCheatingCount] = useState(0)
  const lastCheatingAtRef = useRef(0)

  const handleCheatingDetected = () => {
    if (isEnded) return
    const now = Date.now()
    if (now - lastCheatingAtRef.current < CHEATING_DEBOUNCE_MS) return
    lastCheatingAtRef.current = now
    setCheatingCount((prev) => Math.min(prev + 1, 3))
    setOpenModal('cheating')
  }

  useEffect(() => {
    if (isEnded) return
    const onVisibilityChange = () => {
      if (document.hidden) handleCheatingDetected()
    }
    const onWindowBlur = () => handleCheatingDetected()
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      handleCheatingDetected()
      e.preventDefault()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('blur', onWindowBlur)
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('blur', onWindowBlur)
      window.removeEventListener('beforeunload', onBeforeUnload)
    }
  }, [isEnded, handleCheatingDetected])

  useEffect(() => {
    if (isEnded) return
    const onFullscreenChange = () => {
      if (cheatingCount >= 3) return
      if (!document.fullscreenElement) setOpenModal('fullscreen')
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'F11') {
        e.preventDefault()
        handleCheatingDetected()
      }
    }
    document.addEventListener('fullscreenchange', onFullscreenChange)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [isEnded, cheatingCount, setOpenModal, handleCheatingDetected])

  const handleCheatingClose = () => setOpenModal(null)

  return { cheatingCount, handleCheatingDetected, handleCheatingClose }
}
