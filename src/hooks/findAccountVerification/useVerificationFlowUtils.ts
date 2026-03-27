// FindId/FindPassword용 - 에러 핸들러, AbortController, useErrorBridge, useVerificationActions
import { useCallback, useEffect, useRef } from 'react'
import axios from 'axios'
import type { MappedError } from '@/utils/error/types'
import type { UseVerificationTokenFlowResult } from '@/hooks/findAccountVerification/useVerificationTokenFlow'

export function isAbortOrCancelError(err: unknown): boolean {
  if (err instanceof Error) {
    return err.name === 'AbortError' || err.name === 'CanceledError'
  }
  return axios.isCancel(err)
}

export function useFlowAbortController(isActive: boolean) {
  const abortControllerRef = useRef<AbortController | null>(null)

  // 활성 상태에서만 AbortController 생성/해제
  useEffect(() => {
    if (!isActive) return
    abortControllerRef.current = new AbortController()
    return () => {
      abortControllerRef.current?.abort()
      abortControllerRef.current = null
    }
  }, [isActive])

  return abortControllerRef
}

export function useErrorBridge(
  error: string | null,
  setRootError: (message: string | null) => void
) {
  const prevErrorRef = useRef<string | null | undefined>(undefined)

  // 이전 에러와 동일하면 재설정하지 않음
  useEffect(() => {
    if (prevErrorRef.current === error) return
    prevErrorRef.current = error
    setRootError(error)
  }, [error, setRootError])
}

export function createSendErrorHandler(
  mapError: (err: unknown) => MappedError
): (err: unknown) => string {
  return (err: unknown) =>
    isAbortOrCancelError(err) ? '' : mapError(err).message
}

export function createVerifyErrorHandler(
  mapError: (err: unknown) => MappedError,
  setFieldError: (message: string) => void
): (err: unknown) => string {
  return (err: unknown) => {
    if (isAbortOrCancelError(err)) return ''
    const mappedError = mapError(err)
    if (mappedError.kind === 'field') {
      setFieldError(mappedError.message)
      return ''
    }
    return mappedError.message
  }
}

export type UseVerificationActionsOptions = {
  setRootError: (message: string | null) => void
  clearFieldError: (field: 'verificationCode') => void
  setFindError?: (message: string | null) => void
}

export function useVerificationActions(
  verification: UseVerificationTokenFlowResult,
  options: UseVerificationActionsOptions
) {
  const { setRootError, clearFieldError, setFindError } = options

  const onSend = useCallback(async () => {
    if (!verification.canSend) return
    setFindError?.(null)
    setRootError(null)
    clearFieldError('verificationCode')
    await verification.onSend()
  }, [verification, setRootError, clearFieldError, setFindError])

  const onVerify = useCallback(async () => {
    if (!verification.canVerify) return
    setFindError?.(null)
    setRootError(null)
    clearFieldError('verificationCode')
    await verification.onVerify()
  }, [verification, setRootError, clearFieldError, setFindError])

  const onResend = useCallback(() => {
    if (!verification.codeSent) return
    verification.invalidateVerification()
  }, [verification])

  return { onSend, onVerify, onResend }
}
