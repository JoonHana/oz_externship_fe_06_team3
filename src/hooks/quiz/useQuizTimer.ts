import { useEffect, useRef, useState } from 'react'
import {
  INITIAL_REMAINING_SECONDS,
  QUIZ_TIMER_INTERVAL_MS,
  SECONDS_PER_MINUTE,
} from '@/constants/quiz'
import type { ExamDeploymentDetailResult } from '@/mappers/examDeploymentDetail'

/**
 * API 기준 남은 시간 초기화, 1초 간격 감소, 시간 종료 시 ref로 전달된 제출·종료 함수 호출.
 */
export function useQuizTimer(
  data: ExamDeploymentDetailResult | undefined,
  isEnded: boolean,
  submitAndEndByTimeRef: React.MutableRefObject<() => void>
) {
  const [remainingSeconds, setRemainingSeconds] = useState(INITIAL_REMAINING_SECONDS)
  const [startedAt, setStartedAt] = useState<string>('')
  const hasInitializedTimerFromApi = useRef(false)

  useEffect(() => {
    if (!data || hasInitializedTimerFromApi.current || isEnded) return
    hasInitializedTimerFromApi.current = true
    setStartedAt(new Date().toISOString())
    const durationMinutes = data.durationTime
    const totalSeconds = durationMinutes * SECONDS_PER_MINUTE
    const elapsedSeconds = (data.elapsedTime ?? 0) * SECONDS_PER_MINUTE
    const remaining = Math.max(0, totalSeconds - elapsedSeconds)
    setRemainingSeconds(remaining > 0 ? remaining : totalSeconds)
  }, [data, isEnded])

  useEffect(() => {
    if (isEnded) return
    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          submitAndEndByTimeRef.current()
          return 0
        }
        return prev - 1
      })
    }, QUIZ_TIMER_INTERVAL_MS)//타이머 간격 1초 간격으로 설정
    return () => clearInterval(timer)
  }, [isEnded, submitAndEndByTimeRef])

  const minutes = Math.floor(remainingSeconds / 60)
  const seconds = (remainingSeconds % 60).toString().padStart(2, '0')
  const formattedRemaining = `${minutes} : ${seconds}`

  return { remainingSeconds, setRemainingSeconds, formattedRemaining, startedAt }
}
