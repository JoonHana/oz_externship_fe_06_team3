// 토큰 기반 인증 (send→verify→token) - FindId/FindPassword Flow에서 사용
import { useState, useCallback, useEffect, useRef } from 'react'
import { useCountdown } from '@/hooks/useCountdown'

export type UseVerificationTokenFlowOptions = {
  identity: string
  code: string
  ttlSec: number
  enabled: boolean
  send: (identity: string) => Promise<void>
  verify: (params: {
    identity: string
    code: string
  }) => Promise<{ token: string }>
  getSendErrorMessage?: (err: unknown) => string
  getVerifyErrorMessage?: (err: unknown) => string
  sendSuccessNotice?: string
  verifySuccessNotice?: string
  onInvalidate?: () => void
}

export type UseVerificationTokenFlowResult = {
  token: string | null
  codeSent: boolean
  sending: boolean
  verifying: boolean
  expired: boolean
  secLeft: number
  canSend: boolean
  canVerify: boolean
  verified: boolean
  onSend: () => Promise<void>
  onVerify: () => Promise<void>
  invalidateVerification: () => void
  resetAll: () => void
  notice: string | null
  error: string | null
  formatTime: string
  isActive: boolean
}

export function useVerificationTokenFlow({
  identity,
  code,
  ttlSec,
  enabled,
  send,
  verify,
  getSendErrorMessage,
  getVerifyErrorMessage,
  sendSuccessNotice,
  verifySuccessNotice,
  onInvalidate,
}: UseVerificationTokenFlowOptions): UseVerificationTokenFlowResult {
  const ttlMinutes = Math.ceil(ttlSec / 60)
  const { isExpired, isActive, startTimer, resetTimer, formatTime, timeLeft } =
    useCountdown(ttlMinutes)

  const [token, setToken] = useState<string | null>(null)
  const [codeSent, setCodeSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const prevIdentityRef = useRef(identity)
  const justSentRef = useRef(false)

  const invalidateVerification = useCallback(() => {
    setToken(null)
    setCodeSent(false)
    setNotice(null)
    setError(null)
    resetTimer()
    onInvalidate?.()
  }, [resetTimer, onInvalidate])

  const resetAll = useCallback(() => {
    setToken(null)
    setCodeSent(false)
    setSending(false)
    setVerifying(false)
    setNotice(null)
    setError(null)
    resetTimer()
  }, [resetTimer])

  useEffect(() => {
    if (!enabled) {
      resetAll()
    }
  }, [enabled, resetAll])

  useEffect(() => {
    if (!enabled) return
    if (sending) return
    if (justSentRef.current) {
      justSentRef.current = false
      prevIdentityRef.current = identity
      return
    }
    if (!codeSent && !token) return
    if (prevIdentityRef.current === identity) return
    invalidateVerification()
    prevIdentityRef.current = identity
  }, [identity, codeSent, token, enabled, sending, invalidateVerification])

  const onSend = useCallback(async () => {
    setError(null)
    setNotice(null)
    setSending(true)
    try {
      await send(identity)
      justSentRef.current = true
      setCodeSent(true)
      setNotice(sendSuccessNotice ?? null)
      startTimer()
    } catch (err) {
      const sendErrorMessage = getSendErrorMessage
        ? getSendErrorMessage(err)
        : err instanceof Error
          ? err.message
          : '전송에 실패했습니다.'
      setError(sendErrorMessage?.trim() || null)
    } finally {
      setSending(false)
    }
  }, [identity, send, sendSuccessNotice, startTimer, getSendErrorMessage])

  const onVerify = useCallback(async () => {
    if (!codeSent || isExpired) return
    setError(null)
    setNotice(null)
    setVerifying(true)
    try {
      const response = await verify({ identity, code: code.trim() })
      setToken(response.token)
      setNotice(verifySuccessNotice ?? null)
      resetTimer()
    } catch (err) {
      const verifyErrorMessage = getVerifyErrorMessage
        ? getVerifyErrorMessage(err)
        : err instanceof Error
          ? err.message
          : '인증에 실패했습니다.'
      setError(verifyErrorMessage?.trim() || null)
    } finally {
      setVerifying(false)
    }
  }, [
    identity,
    code,
    codeSent,
    isExpired,
    verify,
    verifySuccessNotice,
    resetTimer,
    getVerifyErrorMessage,
  ])

  const verified = token != null
  const canSend = !verified && !sending
  const canVerify =
    codeSent && !!code.trim() && !isExpired && !verified && !verifying

  return {
    token,
    codeSent,
    sending,
    verifying,
    expired: isExpired,
    secLeft: timeLeft,
    canSend,
    canVerify,
    verified,
    onSend,
    onVerify,
    invalidateVerification,
    resetAll,
    notice,
    error,
    formatTime,
    isActive,
  }
}
