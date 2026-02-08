// 아이디 찾기 비즈니스 로직 - SMS 인증 → findMaskedEmail API
import { useCallback, useMemo, useRef, useState } from 'react'
import * as authApi from '@/api/auth'
import { AUTH_MESSAGES } from '@/constants/authMessages'
import { FIND_ID_PASSWORD_TTL_SECONDS } from '@/constants/auth'
import {
  mapSendSmsError,
  mapVerifySmsError,
  mapFindMaskedEmailError,
} from '@/utils/error/authEndpointErrorMapper'
import { normalizePhone } from '@/utils/normalize'
import {
  createSendErrorHandler,
  createVerifyErrorHandler,
  isAbortOrCancelError,
  useErrorBridge,
  useFlowAbortController,
  useVerificationActions,
} from '@/hooks/findAccountVerification/useVerificationFlowUtils'
import {
  buildVerificationState,
  type VerificationState,
} from '@/hooks/flow/flowVerificationState'
import { useVerificationTokenFlow } from '@/hooks/findAccountVerification/useVerificationTokenFlow'

export type FindIdState =
  | VerificationState<string>
  | {
      step: 'done'
      maskedEmail: string
      notice: string | null
      error: string | null
    }

export type UseFindIdFlowOptions = {
  name: string
  phone: string
  verificationCode: string
  isOpen: boolean
  setRootError: (message: string | null) => void
  setFieldError: (field: 'verificationCode', message: string) => void
  clearFieldError: (field: 'verificationCode') => void
  setVerificationCodeValue: (value: string) => void
}

export type UseFindIdFlowResult = {
  state: FindIdState
  canSend: boolean
  canVerify: boolean
  canFindEmail: boolean
  codeSent: boolean
  verified: boolean
  sending: boolean
  verifying: boolean
  isSubmitting: boolean
  expired: boolean
  formatTime: string
  isActive: boolean
  notice: string | null
  error: string | null
  onSend: () => Promise<void>
  onVerify: () => Promise<void>
  onResend: () => void
  findMaskedEmail: (name: string) => Promise<string | null>
  resetAll: () => void
}

export function useFindIdFlow({
  name,
  phone,
  verificationCode,
  isOpen,
  setRootError,
  setFieldError,
  clearFieldError,
  setVerificationCodeValue,
}: UseFindIdFlowOptions): UseFindIdFlowResult {
  const phoneNormalized = normalizePhone(phone)
  const [maskedEmail, setMaskedEmail] = useState<string | null>(null)
  const [maskedEmailError, setMaskedEmailError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const maskedEmailRequestSeqRef = useRef(0)
  const abortControllerRef = useFlowAbortController(isOpen)

  // 인증 토큰 플로우 (SMS 전송/검증)
  const verification = useVerificationTokenFlow({
    identity: `${name}|${phoneNormalized}`,
    isIdentityValid: name.trim().length > 0 && phoneNormalized.length > 0,
    code: verificationCode,
    ttlSec: FIND_ID_PASSWORD_TTL_SECONDS,
    enabled: isOpen,
    send: async () => {
      await authApi.sendSmsVerification(
        { phoneNumber: phoneNormalized },
        { signal: abortControllerRef.current?.signal }
      )
    },
    verify: async ({ code }) => {
      const response = await authApi.verifySmsCode(
        { phoneNumber: phoneNormalized, verificationCode: code },
        { signal: abortControllerRef.current?.signal }
      )
      return { token: response.smsToken }
    },
    getSendErrorMessage: createSendErrorHandler(mapSendSmsError),
    getVerifyErrorMessage: createVerifyErrorHandler(mapVerifySmsError, (msg) =>
      setFieldError('verificationCode', msg)
    ),
    sendSuccessNotice: AUTH_MESSAGES.findId.sendSuccess,
    verifySuccessNotice: AUTH_MESSAGES.findId.verifySuccess,
    onInvalidate: () => {
      maskedEmailRequestSeqRef.current += 1
      setIsSubmitting(false)
      setVerificationCodeValue('')
      setMaskedEmail(null)
      setMaskedEmailError(null)
    },
  })

  const rootErrorToDisplay = maskedEmailError ?? verification.error
  useErrorBridge(rootErrorToDisplay ?? null, setRootError)

  const findIdState: FindIdState = useMemo(() => {
    const error = maskedEmailError ?? verification.error
    if (maskedEmail) {
      return { step: 'done', maskedEmail, notice: verification.notice, error }
    }
    return buildVerificationState(verification, maskedEmailError)
  }, [maskedEmail, maskedEmailError, verification])

  const resetAll = useCallback(() => {
    verification.resetAll()
    setMaskedEmail(null)
    setMaskedEmailError(null)
    setIsSubmitting(false)
    setVerificationCodeValue('')
  }, [verification, setVerificationCodeValue])

  const { onSend, onVerify, onResend } = useVerificationActions(verification, {
    setRootError,
    clearFieldError,
    setFindError: setMaskedEmailError,
  })

  // 인증 완료 후 아이디(마스킹 이메일) 조회
  const findMaskedEmail = useCallback(
    async (userName: string): Promise<string | null> => {
      if (isSubmitting) return null
      if (!verification.token) return null

      const requestSeq = maskedEmailRequestSeqRef.current + 1
      maskedEmailRequestSeqRef.current = requestSeq

      setMaskedEmailError(null)
      setRootError(null)
      setIsSubmitting(true)

      try {
        const response = await authApi.findMaskedEmail(
          { name: userName, smsToken: verification.token },
          { signal: abortControllerRef.current?.signal }
        )
        if (maskedEmailRequestSeqRef.current !== requestSeq) return null
        setMaskedEmail(response.maskedEmail)
        return response.maskedEmail
      } catch (error) {
        if (maskedEmailRequestSeqRef.current !== requestSeq) return null
        if (isAbortOrCancelError(error)) return null
        const mappedError = mapFindMaskedEmailError(error)
        if (mappedError.kind === 'form') {
          setMaskedEmailError(mappedError.message)
        }
        return null
      } finally {
        if (maskedEmailRequestSeqRef.current === requestSeq) {
          setIsSubmitting(false)
        }
      }
    },
    [verification.token, abortControllerRef, isSubmitting, setRootError]
  )

  return {
    state: findIdState,
    canSend: verification.canSend,
    canVerify: verification.canVerify,
    canFindEmail: !!verification.token,
    codeSent: verification.codeSent,
    verified: verification.verified,
    sending: verification.sending,
    verifying: verification.verifying,
    isSubmitting,
    expired: verification.expired,
    formatTime: verification.formatTime,
    isActive: verification.isActive,
    notice: findIdState.notice ?? null,
    error: findIdState.error ?? null,
    onSend,
    onVerify,
    onResend,
    findMaskedEmail,
    resetAll,
  }
}
