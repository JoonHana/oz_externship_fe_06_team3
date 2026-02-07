import { useRef, useState, useEffect } from 'react'
import { CHEATING_DEBOUNCE_MS } from '@/constants/quiz'

export type QuizOpenModal = 'cheating' | 'fullscreen' | 'submitComplete'

/**
 * 부정행위 감지: visibilitychange, blur, fullscreen 해제, Escape/F11.
 * 디바운스 적용, 최대 3회까지 카운트.
 * (handleCheatingDetected를 ref에 넣어 effect 의존성에서 제외 → 매 렌더마다 리스너 재등록 방지)
 */
export function useCheatingDetection(
  isEnded: boolean,
  setOpenModal: (modal: QuizOpenModal | null) => void
) {
  const [cheatingCount, setCheatingCount] = useState(0)
  const lastCheatingAtRef = useRef(0)
  const handlerRef = useRef<() => void>(() => {})

  const handleCheatingDetected = () => {
    if (isEnded) return
    const now = Date.now()
    if (now - lastCheatingAtRef.current < CHEATING_DEBOUNCE_MS) return
    lastCheatingAtRef.current = now
    setCheatingCount((prev) => Math.min(prev + 1, 3))
    setOpenModal('cheating')
  }
  handlerRef.current = handleCheatingDetected

  useEffect(() => {
    if (isEnded) return
    const onVisibilityChange = () => {
      if (document.hidden) handlerRef.current()
    }
    const onWindowBlur = () => handlerRef.current()
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      handlerRef.current()
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
  }, [isEnded])

  useEffect(() => {
    if (isEnded) return
    const onFullscreenChange = () => {
      if (cheatingCount >= 3) return
      if (!document.fullscreenElement) setOpenModal('fullscreen')
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'F11') {
        e.preventDefault()
        handlerRef.current()
      }
    }
    document.addEventListener('fullscreenchange', onFullscreenChange)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [isEnded, cheatingCount, setOpenModal])

  const handleCheatingClose = () => setOpenModal(null)

  return { cheatingCount, handleCheatingDetected, handleCheatingClose }
}
