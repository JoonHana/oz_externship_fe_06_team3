import { useEffect, useState, useCallback } from 'react'

/**
 * 인증 코드 유효 시간용 카운트다운 타이머 훅
 * (회원가입, 아이디/비밀번호 찾기, 계정 복구 등)
 * @param initialMinutes 초기 분 단위 시간 (기본값: 5분)
 * @returns { timeLeft, isExpired, isActive, startTimer, resetTimer, formatTime }
 */
export function useCountdown(initialMinutes: number = 5) {
  const [timeLeft, setTimeLeft] = useState<number>(initialMinutes * 60) 
  const [isActive, setIsActive] = useState<boolean>(false)

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsActive(false)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isActive, timeLeft])

  const startTimer = useCallback(() => {
    setTimeLeft(initialMinutes * 60)
    setIsActive(true)
  }, [initialMinutes])

  const resetTimer = useCallback(() => {
    setTimeLeft(initialMinutes * 60)
    setIsActive(false)
  }, [initialMinutes])

  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }, [])

  const isExpired = timeLeft === 0

  return {
    timeLeft,
    isExpired,
    isActive,
    startTimer,
    resetTimer,
    formatTime: formatTime(timeLeft),
  }
}
