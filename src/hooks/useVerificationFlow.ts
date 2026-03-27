// 이메일/SMS 인증의 공통 로직 (인증번호 전송 → 타이머 시작 → 인증번호 입력 → 검증 → 토큰 획득)
import { useEffect, useMemo, useReducer, useCallback } from 'react'
import type { Path } from 'react-hook-form'
import type { SignupFormData } from '@/schemas/auth'
import { useCountdown } from '@/hooks/useCountdown'
import { useVerificationRequestScope } from '@/hooks/verification/useVerificationRequestScope'
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
  const ttlMinutes = Math.ceil(ttlSec / 60)
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

  const { token, verified, codeSent, sendStatus, flowMessage, verifyStatus } = state
  const { prevIdentityRef: previousIdentityRef, isCurrentRequest } =
    useVerificationRequestScope({
      identity,
      enabled: true,
    })

  // identity 변경 시 모든 상태 초기화 + 타이머 리셋
  const resetAll = useCallback(() => {
    dispatch({ type: 'IDENTITY_CHANGED' })
    resetTimer()
  }, [resetTimer])

  // identity(이메일/전화번호) 변경 감지 → resetAll 호출
  useEffect(() => {
    if (previousIdentityRef.current === identity) return
    previousIdentityRef.current = identity

    const hasActiveVerification =
      codeSent ||
      verified ||
      token != null ||
      sendStatus === 'pending' ||
      verifyStatus === 'pending'
    if (hasActiveVerification) {
      resetAll()
    }
  }, [
    identity,
    resetAll,
    codeSent,
    verified,
    token,
    sendStatus,
    verifyStatus,
    previousIdentityRef,
  ])

  // 인증번호 입력 비워지면 검증 에러/필드 에러 초기화
  useEffect(() => {
    if (!code?.trim()) {
      if (verifyStatus === 'error') {
        dispatch({ type: 'RESET_VERIFY_STATE' })
      }
      clearErrors(codeField)
    }
  }, [code, verifyStatus, clearErrors, codeField])

  // 검증 상태만 초기화 (verified, token, verifyStatus 리셋)
  const resetVerifyState = useCallback(() => {
    dispatch({ type: 'RESET_VERIFY_STATE' })
  }, [])

  // identity 형식 검사 실패 시 identityFields에 에러 표시
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

  // identity(이메일/전화번호) 형식 유효 여부
  const identityValid = useMemo(
    () => validateIdentity(identity).ok,
    [identity, validateIdentity]
  )

  // canSend, canVerify, fieldState, codeFieldState 계산
  // UI 파생 상태 계산
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

  // 인증번호 전송 버튼 클릭 시: 형식 검사 → API 호출 → 타이머 시작
  const handleSendCode = useCallback(async () => {
    clearErrors([...identityFields, codeField])

    const validationResult = validateIdentity(identity)
    if (!validationResult.ok) {
      applyValidationError(validationResult)
      resetTimer()
      return
    }

    if (busy || sendStatus === 'pending' || verifyStatus === 'pending') return

    resetVerifyState()
    dispatch({ type: 'SEND_REQUEST' })

    const isResend = codeSent
    const requestedIdentity = identity
    await withBusy({ setBusy }, async () => {
      try {
        await send(requestedIdentity)
        if (!isCurrentRequest(requestedIdentity)) return
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
        if (!isCurrentRequest(requestedIdentity)) return
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
    verifyStatus,
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
    isCurrentRequest,
    text.sent,
    text.resent,
  ])

  // 인증번호 확인 버튼 클릭 시: 유효성 검사 → API 호출 → 토큰 저장
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

    if (busy || verifyStatus === 'pending' || sendStatus === 'pending') return

    const requestedIdentity = identity
    await withBusy({ setBusy }, async () => {
      dispatch({ type: 'VERIFY_REQUEST' })
      try {
        const verifyResponse = await verify(requestedIdentity, code.trim())
        if (!isCurrentRequest(requestedIdentity)) return
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
        if (!isCurrentRequest(requestedIdentity)) return
        const errorMessage = getVerifyErrorMessage(verifyError)
        dispatch({ type: 'VERIFY_FAILURE', payload: { message: errorMessage } })
      }
    })
  }, [
    identity,
    code,
    busy,
    verifyStatus,
    sendStatus,
    isRunning,
    clearErrors,
    codeField,
    setFieldError,
    resetVerifyState,
    setBusy,
    verify,
    getToken,
    getVerifyErrorMessage,
    isCurrentRequest,
    text.codeRequired,
    text.expired,
    text.verifySuccess,
    resetTimer,
  ])

  // 타이머 관련 값/함수 묶음 (remain, mmss, isRunning, start, reset)
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
