// 비밀번호 찾기 비즈니스 로직 - 이메일 인증 → token 받아서 onVerified로 전달
import { useCallback, useMemo } from 'react'
import * as authApi from '@/api/auth'
import { AUTH_MESSAGES } from '@/constants/authMessages'
import { FIND_ID_PASSWORD_TTL_SECONDS } from '@/constants/auth'
import {
  mapSendEmailError,
  mapVerifyEmailError,
} from '@/utils/error/authEndpointErrorMapper'
import { normalizeEmail } from '@/utils/normalize'
import {
  createSendErrorHandler,
  createVerifyErrorHandler,
  useErrorBridge,
  useFlowAbortController,
  useVerificationActions,
} from '@/hooks/findAccountVerification/useVerificationFlowUtils'
import {
  buildVerificationState,
  type VerificationState,
} from './flowVerificationState'
import { useVerificationTokenFlow } from '@/hooks/findAccountVerification/useVerificationTokenFlow'

export type FindPasswordState = VerificationState<string>

export type FindPasswordVerifiedPayload = {
  email: string
  emailToken: string
}

export type UseFindPasswordFlowOptions = {
  email: string
  verificationCode: string
  isOpen: boolean
  setRootError: (message: string | null) => void
  setFieldError: (field: 'verificationCode', message: string) => void
  clearFieldError: (field: 'verificationCode') => void
  setVerificationCodeValue: (value: string) => void
  onVerified?: (payload: FindPasswordVerifiedPayload) => void
}

export type UseFindPasswordFlowResult = {
  state: FindPasswordState
  canSend: boolean
  canVerify: boolean
  canSubmitToReset: boolean
  codeSent: boolean
  verified: boolean
  sending: boolean
  verifying: boolean
  expired: boolean
  formatTime: string
  isActive: boolean
  notice: string | null
  error: string | null
  onSend: () => Promise<void>
  onVerify: () => Promise<void>
  onResend: () => void
  submitToReset: (email: string) => void
  resetAll: () => void
}

export function useFindPasswordFlow({
  email,
  verificationCode,
  isOpen,
  setRootError,
  setFieldError,
  clearFieldError,
  setVerificationCodeValue,
  onVerified,
}: UseFindPasswordFlowOptions): UseFindPasswordFlowResult {
  const emailNormalized = normalizeEmail(email)
  const abortControllerRef = useFlowAbortController(isOpen)

  const verification = useVerificationTokenFlow({
    identity: emailNormalized,
    code: verificationCode,
    ttlSec: FIND_ID_PASSWORD_TTL_SECONDS,
    enabled: isOpen,
    send: async (identity) => {
      await authApi.sendEmailVerification(
        { email: identity },
        { signal: abortControllerRef.current?.signal }
      )
    },
    verify: async ({ identity, code }) => {
      const response = await authApi.verifyEmailCode(
        { email: identity, verificationCode: code },
        { signal: abortControllerRef.current?.signal }
      )
      return { token: response.emailToken }
    },
    getSendErrorMessage: createSendErrorHandler(mapSendEmailError),
    getVerifyErrorMessage: createVerifyErrorHandler(
      mapVerifyEmailError,
      (msg) => setFieldError('verificationCode', msg)
    ),
    sendSuccessNotice: AUTH_MESSAGES.findPassword.sendSuccess,
    verifySuccessNotice: AUTH_MESSAGES.findPassword.verifySuccess,
    onInvalidate: () => setVerificationCodeValue(''),
  })

  useErrorBridge(verification.error ?? null, setRootError)

  const findPasswordState: FindPasswordState = useMemo(
    () => buildVerificationState(verification),
    [verification]
  )

  const resetAll = useCallback(() => {
    verification.resetAll()
    setVerificationCodeValue('')
  }, [verification, setVerificationCodeValue])

  const { onSend, onVerify, onResend } = useVerificationActions(verification, {
    setRootError,
    clearFieldError,
  })

  const canSubmitToReset =
    verification.token != null && emailNormalized.length > 0

  const submitToReset = useCallback(
    (email: string) => {
      if (!canSubmitToReset) return
      onVerified?.({
        email,
        emailToken: verification.token!,
      })
    },
    [verification.token, canSubmitToReset, onVerified]
  )

  return {
    state: findPasswordState,
    canSend: verification.canSend,
    canVerify: verification.canVerify,
    canSubmitToReset,
    codeSent: verification.codeSent,
    verified: verification.verified,
    sending: verification.sending,
    verifying: verification.verifying,
    expired: verification.expired,
    formatTime: verification.formatTime,
    isActive: verification.isActive,
    notice: findPasswordState.notice ?? null,
    error: findPasswordState.error ?? null,
    onSend,
    onVerify,
    onResend,
    submitToReset,
    resetAll,
  }
}
