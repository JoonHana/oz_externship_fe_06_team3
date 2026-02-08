// 토큰 기반 인증 (send→verify→token) - FindId/FindPassword Flow에서 사용
import { useState, useCallback, useEffect, useRef } from 'react'
import { useCountdown } from '@/hooks/useCountdown'
import { useVerificationRequestScope } from '@/hooks/verification/useVerificationRequestScope'

export type UseVerificationTokenFlowOptions = {
  identity: string
  isIdentityValid?: boolean
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
  isIdentityValid,
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
  const normalizedIdentity = identity.trim()
  const hasIdentity =
    isIdentityValid !== undefined
      ? isIdentityValid
      : normalizedIdentity.length > 0
  const ttlMinutes = Math.ceil(ttlSec / 60)
  const { isExpired, isActive, startTimer, resetTimer, formatTime, timeLeft } =
    useCountdown(ttlMinutes)

  const [token, setToken] = useState<string | null>(null)
  const [codeSent, setCodeSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const sendRequestSeqRef = useRef(0)
  const verifyRequestSeqRef = useRef(0)

  const { prevIdentityRef, isCurrentRequest } = useVerificationRequestScope({
    identity: normalizedIdentity,
    enabled,
  })

  const invalidateVerification = useCallback(() => {
    sendRequestSeqRef.current += 1
    verifyRequestSeqRef.current += 1
    setToken(null)
    setCodeSent(false)
    setSending(false)
    setVerifying(false)
    setNotice(null)
    setError(null)
    resetTimer()
    onInvalidate?.()
  }, [resetTimer, onInvalidate])

  const resetAll = useCallback(() => {
    sendRequestSeqRef.current += 1
    verifyRequestSeqRef.current += 1
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
    if (!enabled) {
      prevIdentityRef.current = normalizedIdentity
      return
    }
    if (prevIdentityRef.current === normalizedIdentity) return
    prevIdentityRef.current = normalizedIdentity

    const hasActiveVerification =
      codeSent || token != null || sending || verifying
    if (hasActiveVerification) {
      invalidateVerification()
    }
  }, [
    normalizedIdentity,
    codeSent,
    token,
    enabled,
    sending,
    verifying,
    invalidateVerification,
    prevIdentityRef,
  ])

  // 모달 닫힘 상태(enabled=false)에서는 전송/검증 방지
  const onSend = useCallback(async () => {
    if (!enabled || !hasIdentity || sending || verifying || token != null) return
    setError(null)
    setNotice(null)
    setSending(true)
    const requestedIdentity = normalizedIdentity
    const requestSeq = sendRequestSeqRef.current + 1
    sendRequestSeqRef.current = requestSeq
    try {
      await send(requestedIdentity)
      if (
        sendRequestSeqRef.current !== requestSeq ||
        !isCurrentRequest(requestedIdentity)
      )
        return
      setCodeSent(true)
      setNotice(sendSuccessNotice ?? null)
      startTimer()
    } catch (err) {
      if (
        sendRequestSeqRef.current !== requestSeq ||
        !isCurrentRequest(requestedIdentity)
      )
        return
      const sendErrorMessage = getSendErrorMessage
        ? getSendErrorMessage(err)
        : err instanceof Error
          ? err.message
          : '전송에 실패했습니다.'
      setError(sendErrorMessage?.trim() || null)
    } finally {
      if (sendRequestSeqRef.current === requestSeq) {
        setSending(false)
      }
    }
  }, [
    enabled,
    hasIdentity,
    normalizedIdentity,
    sending,
    verifying,
    token,
    send,
    sendSuccessNotice,
    startTimer,
    getSendErrorMessage,
    isCurrentRequest,
  ])

  const onVerify = useCallback(async () => {
    if (
      !enabled ||
      !hasIdentity ||
      !codeSent ||
      isExpired ||
      sending ||
      verifying ||
      token != null
    )
      return
    setError(null)
    setNotice(null)
    setVerifying(true)
    const requestedIdentity = normalizedIdentity
    const requestedCode = code.trim()
    const requestSeq = verifyRequestSeqRef.current + 1
    verifyRequestSeqRef.current = requestSeq
    try {
      const response = await verify({
        identity: requestedIdentity,
        code: requestedCode,
      })
      if (
        verifyRequestSeqRef.current !== requestSeq ||
        !isCurrentRequest(requestedIdentity)
      )
        return
      setToken(response.token)
      setNotice(verifySuccessNotice ?? null)
      resetTimer()
    } catch (err) {
      if (
        verifyRequestSeqRef.current !== requestSeq ||
        !isCurrentRequest(requestedIdentity)
      )
        return
      const verifyErrorMessage = getVerifyErrorMessage
        ? getVerifyErrorMessage(err)
        : err instanceof Error
          ? err.message
          : '인증에 실패했습니다.'
      setError(verifyErrorMessage?.trim() || null)
    } finally {
      if (verifyRequestSeqRef.current === requestSeq) {
        setVerifying(false)
      }
    }
  }, [
    enabled,
    hasIdentity,
    normalizedIdentity,
    code,
    codeSent,
    isExpired,
    sending,
    verifying,
    token,
    verify,
    verifySuccessNotice,
    resetTimer,
    getVerifyErrorMessage,
    isCurrentRequest,
  ])

  const verified = token != null
  const canSend = enabled && hasIdentity && !verified && !sending && !verifying
  const canVerify =
    enabled &&
    hasIdentity &&
    codeSent &&
    !!code.trim() &&
    !isExpired &&
    !verified &&
    !sending &&
    !verifying

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
