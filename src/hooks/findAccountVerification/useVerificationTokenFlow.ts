// 토큰 기반 인증 (send→verify→token) - FindId/FindPassword Flow에서 사용
import { useState, useCallback, useEffect, useRef } from 'react'
import { useCountdown } from '@/hooks/useCountdown'
import { useVerificationRequestScope } from '@/hooks/verification/useVerificationRequestScope'

const DEFAULT_SEND_ERROR_MESSAGE = '전송에 실패했습니다.'
const DEFAULT_VERIFY_ERROR_MESSAGE = '인증에 실패했습니다.'

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

function resolveErrorMessage(
  err: unknown,
  getErrorMessage: ((err: unknown) => string) | undefined,
  fallback: string
): string | null {
  const message = getErrorMessage
    ? getErrorMessage(err)
    : err instanceof Error
      ? err.message
      : fallback
  return message?.trim() || null
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
  const trimmedCode = code.trim()
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

  const clearVerificationState = useCallback(
    (options?: { invokeInvalidateCallback?: boolean }) => {
      sendRequestSeqRef.current += 1
      verifyRequestSeqRef.current += 1
      setToken(null)
      setCodeSent(false)
      setSending(false)
      setVerifying(false)
      setNotice(null)
      setError(null)
      resetTimer()
      if (options?.invokeInvalidateCallback) {
        onInvalidate?.()
      }
    },
    [resetTimer, onInvalidate]
  )

  const invalidateVerification = useCallback(() => {
    clearVerificationState({ invokeInvalidateCallback: true })
  }, [clearVerificationState])

  const resetAll = useCallback(() => {
    clearVerificationState()
  }, [clearVerificationState])

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
    const hasPendingRequest = sending || verifying
    const isBlocked =
      !enabled || !hasIdentity || hasPendingRequest || token != null
    if (isBlocked) return

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
      setError(
        resolveErrorMessage(err, getSendErrorMessage, DEFAULT_SEND_ERROR_MESSAGE)
      )
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
    const hasPendingRequest = sending || verifying
    const isBlocked =
      !enabled ||
      !hasIdentity ||
      !codeSent ||
      isExpired ||
      hasPendingRequest ||
      token != null
    if (isBlocked) return
    if (!trimmedCode) return

    setError(null)
    setNotice(null)
    setVerifying(true)
    const requestedIdentity = normalizedIdentity
    const requestedCode = trimmedCode
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
      setError(
        resolveErrorMessage(
          err,
          getVerifyErrorMessage,
          DEFAULT_VERIFY_ERROR_MESSAGE
        )
      )
    } finally {
      if (verifyRequestSeqRef.current === requestSeq) {
        setVerifying(false)
      }
    }
  }, [
    enabled,
    hasIdentity,
    codeSent,
    isExpired,
    sending,
    verifying,
    token,
    normalizedIdentity,
    trimmedCode,
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
    !!trimmedCode &&
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
