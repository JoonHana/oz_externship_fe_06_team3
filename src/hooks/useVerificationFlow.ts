// 회원가입용 인증 플로우 - 이메일/SMS send→verify→token (useEmailVerification, useSmsVerification에서 사용)
import { useEffect, useMemo, useReducer, useCallback, useRef } from 'react'
import type { Path } from 'react-hook-form'
import type { SignupFormData } from '@/schemas/auth'
import { useCountdown } from '@/hooks/useCountdown'
import {
  verificationReducer,
  computeVerificationUI,
  applyIdentityValidationError,
  withBusy,
  INITIAL_VERIFICATION_STATE,
  SEND_MODE,
  type VerificationState,
  type ValidationResult,
} from '@/hooks/signupVerification'

export type Status = 'idle' | 'pending' | 'error' | 'success'

type UseVerificationFlowArgs<TVerifyRes> = {
  identity: string
  code: string
  ttlSec: number
  busy: boolean
  setBusy: (value: boolean) => void
  clearErrors: (names: Path<SignupFormData> | Path<SignupFormData>[]) => void
  setFieldError: (name: Path<SignupFormData>, message: string) => void
  identityFields: Path<SignupFormData>[]
  codeField: Path<SignupFormData>
  validateIdentity: (identity: string) => ValidationResult
  send: (identity: string) => Promise<void>
  verify: (identity: string, code: string) => Promise<TVerifyRes>
  getToken: (response: TVerifyRes) => string
  getSendErrorMessage: (error: unknown) => string
  getVerifyErrorMessage: (error: unknown) => string
  text: {
    sent: string
    resent: string
    identityInvalid: string
    codeRequired: string
    expired: string
    verifySuccess: string
  }
}

const SECONDS_PER_MINUTE = 60

export function useVerificationFlow<TVerifyRes>({
  identity,
  code,
  ttlSec,
  busy,
  setBusy,
  clearErrors,
  setFieldError,
  identityFields,
  codeField,
  validateIdentity,
  send,
  verify,
  getToken,
  getSendErrorMessage,
  getVerifyErrorMessage,
  text,
}: UseVerificationFlowArgs<TVerifyRes>) {
  const ttlMinutes = Math.ceil(ttlSec / SECONDS_PER_MINUTE)
  const {
    timeLeft: remain,
    formatTime: mmss,
    isActive: isRunning,
    startTimer,
    resetTimer,
  } = useCountdown(ttlMinutes)

  const [state, dispatch] = useReducer(
    verificationReducer,
    INITIAL_VERIFICATION_STATE as VerificationState
  )

  const {
    token,
    verified,
    codeSent,
    sendStatus,
    flowMessage,
    verifyStatus,
  } = state

  const previousIdentityRef = useRef(identity)
  const justSentRef = useRef(false)

  const resetAll = useCallback(() => {
    dispatch({ type: 'IDENTITY_CHANGED' })
    resetTimer()
  }, [resetTimer])

  useEffect(() => {
    if (sendStatus === 'pending') return
    if (justSentRef.current) {
      justSentRef.current = false
      previousIdentityRef.current = identity
      return
    }
    if (previousIdentityRef.current === identity) return
    previousIdentityRef.current = identity
    resetAll()
  }, [identity, resetAll, sendStatus])

  useEffect(() => {
    if (!code?.trim()) {
      if (verifyStatus === 'error') {
        dispatch({ type: 'RESET_VERIFY_STATE' })
      }
      clearErrors(codeField)
    }
  }, [code, verifyStatus, clearErrors, codeField])

  const resetVerifyState = useCallback(() => {
    dispatch({ type: 'RESET_VERIFY_STATE' })
  }, [])

  const applyValidationError = useCallback(
    (validationResult: ValidationResult) => {
      applyIdentityValidationError({
        validationResult,
        defaultMessage: text.identityInvalid,
        identityFields,
        setFieldError,
      })
    },
    [text.identityInvalid, identityFields, setFieldError]
  )

  const identityValid = useMemo(
    () => validateIdentity(identity).ok,
    [identity, validateIdentity]
  )

  const ui = useMemo(
    () =>
      computeVerificationUI({
        verified,
        sendStatus,
        verifyStatus,
        codeSent,
        code,
        busy,
        identityValid,
      }),
    [verified, sendStatus, verifyStatus, codeSent, code, busy, identityValid]
  )

  const handleSendCode = useCallback(async () => {
    clearErrors([...identityFields, codeField])

    const validationResult = validateIdentity(identity)
    if (!validationResult.ok) {
      applyValidationError(validationResult)
      resetTimer()
      return
    }

    if (busy || sendStatus === 'pending') return

    resetVerifyState()
    dispatch({ type: 'SEND_REQUEST' })

    const isResend = codeSent
    await withBusy({ setBusy }, async () => {
      try {
        await send(identity)
        justSentRef.current = true
        dispatch({
          type: 'SEND_SUCCESS',
          payload: {
            mode: isResend ? SEND_MODE.RESEND : SEND_MODE.FIRST,
            sent: text.sent,
            resent: text.resent,
          },
        })
        startTimer()
      } catch (sendError) {
        const errorMessage = getSendErrorMessage(sendError)
        dispatch({ type: 'SEND_FAILURE', payload: { message: errorMessage } })
        resetTimer()
      }
    })
  }, [
    identity,
    codeSent,
    busy,
    sendStatus,
    clearErrors,
    identityFields,
    codeField,
    validateIdentity,
    applyValidationError,
    resetTimer,
    resetVerifyState,
    setBusy,
    send,
    startTimer,
    getSendErrorMessage,
    text.sent,
    text.resent,
  ])

  const handleVerifyCode = useCallback(async () => {
    clearErrors(codeField)

    if (!code?.trim()) {
      setFieldError(codeField, text.codeRequired)
      return
    }

    if (!isRunning) {
      resetVerifyState()
      dispatch({ type: 'EXPIRED', payload: { message: text.expired } })
      return
    }

    if (busy || verifyStatus === 'pending') return

    await withBusy({ setBusy }, async () => {
      dispatch({ type: 'VERIFY_REQUEST' })
      try {
        const verifyResponse = await verify(identity, code.trim())
        const tokenValue = getToken(verifyResponse)
        dispatch({
          type: 'VERIFY_SUCCESS',
          payload: {
            token: tokenValue,
            message: text.verifySuccess,
          },
        })
        resetTimer()
      } catch (verifyError) {
        const errorMessage = getVerifyErrorMessage(verifyError)
        dispatch({ type: 'VERIFY_FAILURE', payload: { message: errorMessage } })
      }
    })
  }, [
    identity,
    code,
    busy,
    verifyStatus,
    isRunning,
    clearErrors,
    codeField,
    setFieldError,
    resetVerifyState,
    setBusy,
    verify,
    getToken,
    getVerifyErrorMessage,
    text.codeRequired,
    text.expired,
    text.verifySuccess,
    resetTimer,
  ])

  const timer = useMemo(
    () => ({
      remain,
      mmss,
      isRunning,
      start: startTimer,
      reset: resetTimer,
    }),
    [remain, mmss, isRunning, startTimer, resetTimer]
  )

  return {
    token,
    verified,
    codeSent,
    sendStatus,
    flowMessage,
    verifyStatus,
    timer,
    ui,
    actions: {
      onSendCode: handleSendCode,
      onVerifyCode: handleVerifyCode,
    },
  }
}
