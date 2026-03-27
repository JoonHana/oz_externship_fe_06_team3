// 비밀번호 재설정 - emailToken 받아서 resetPassword 1회 호출, 성공/닫기 시 토큰 제거
import { useCallback, useEffect, useReducer, useRef } from 'react'
import * as authApi from '@/api/auth'
import { mapResetPasswordError } from '@/utils/error/authEndpointErrorMapper'

export type ResetPasswordStep = 'ready' | 'submitting' | 'done'

export type ResetPasswordState =
  | { step: 'ready'; emailToken: string; error: string | null }
  | { step: 'submitting'; emailToken: string; error: string | null }
  | { step: 'done'; emailToken?: never; error: string | null }

const RESET_PASSWORD_ACTIONS = {
  INGEST_TOKEN: 'INGEST_TOKEN',
  SUBMIT_START: 'SUBMIT_START',
  SUBMIT_SUCCESS: 'SUBMIT_SUCCESS',
  SUBMIT_FAILURE: 'SUBMIT_FAILURE',
  RESET: 'RESET',
} as const

type ResetPasswordAction =
  | { type: typeof RESET_PASSWORD_ACTIONS.INGEST_TOKEN; emailToken: string }
  | { type: typeof RESET_PASSWORD_ACTIONS.SUBMIT_START }
  | { type: typeof RESET_PASSWORD_ACTIONS.SUBMIT_SUCCESS }
  | { type: typeof RESET_PASSWORD_ACTIONS.SUBMIT_FAILURE; keepToken?: boolean }
  | { type: typeof RESET_PASSWORD_ACTIONS.RESET }

function resetPasswordReducer(
  state: ResetPasswordState,
  action: ResetPasswordAction
): ResetPasswordState {
  switch (action.type) {
    case RESET_PASSWORD_ACTIONS.INGEST_TOKEN:
      return {
        step: 'ready',
        emailToken: action.emailToken,
        error: null,
      }
    case RESET_PASSWORD_ACTIONS.SUBMIT_START:
      if (state.step !== 'ready' || !('emailToken' in state)) return state
      return {
        step: 'submitting',
        emailToken: state.emailToken,
        error: null,
      }
    case RESET_PASSWORD_ACTIONS.SUBMIT_SUCCESS:
      return { step: 'done', error: null }
    case RESET_PASSWORD_ACTIONS.SUBMIT_FAILURE:
      if (action.keepToken === false) {
        return { step: 'done', error: null }
      }
      if (state.step === 'submitting' && 'emailToken' in state) {
        return {
          step: 'ready',
          emailToken: state.emailToken,
          error: null,
        }
      }
      return state
    case RESET_PASSWORD_ACTIONS.RESET:
      return { step: 'done', error: null }
    default:
      return state
  }
}

export type UseResetPasswordFlowOptions = {
  // 부모가 전달. Flow가 mount/수신 시 state에 저장 후 소유
  initialToken: string | null
  setRootError: (message: string | null) => void
}

export type UseResetPasswordFlowResult = {
  state: ResetPasswordState
  step: ResetPasswordStep
  canSubmit: boolean
  isSubmitting: boolean
  submitPassword: (newPassword: string) => Promise<boolean>
  resetAll: () => void
}

export function useResetPasswordFlow({
  initialToken,
  setRootError,
}: UseResetPasswordFlowOptions): UseResetPasswordFlowResult {
  // 상태 머신 초기화
  const [state, dispatch] = useReducer(
    resetPasswordReducer,
    { initialToken },
    (init) =>
      init.initialToken
        ? {
            step: 'ready' as const,
            emailToken: init.initialToken,
            error: null,
          }
        : { step: 'done' as const, error: null }
  )

  // initialToken prop 수신 시 state에 저장 (유일한 생성)
  useEffect(() => {
    if (initialToken && state.step === 'done') {
      dispatch({
        type: RESET_PASSWORD_ACTIONS.INGEST_TOKEN,
        emailToken: initialToken,
      })
    }
  }, [initialToken, state.step])

  // 부모가 token null로 변경 시 즉시 폐기
  useEffect(() => {
    if (
      !initialToken &&
      (state.step === 'ready' || state.step === 'submitting')
    ) {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console -- 개발 환경 디버그용
        console.warn(
          '[ResetPasswordFlow] initialToken revoked, resetting to done'
        )
      }
      dispatch({ type: RESET_PASSWORD_ACTIONS.RESET })
    }
  }, [initialToken, state.step])

  // 런타임 가드: ready/submitting인데 token 없으면 reset
  useEffect(() => {
    if (
      (state.step === 'ready' || state.step === 'submitting') &&
      !('emailToken' in state)
    ) {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console -- 개발 환경 디버그용
        console.warn(
          '[ResetPasswordFlow] token missing in ready/submitting, resetting'
        )
      }
      dispatch({ type: RESET_PASSWORD_ACTIONS.RESET })
    }
  }, [state.step, state])

  const prevErrorRef = useRef<string | null | undefined>(undefined)
  useEffect(() => {
    if (prevErrorRef.current === state.error) return
    prevErrorRef.current = state.error
    setRootError(state.error)
  }, [state.error, setRootError])

  // 제출 가능 여부
  const canSubmit =
    state.step === 'ready' && 'emailToken' in state && !!state.emailToken
  const isSubmitting = state.step === 'submitting'

  const submitPassword = useCallback(
    async (newPassword: string): Promise<boolean> => {
      if (state.step !== 'ready' || !('emailToken' in state)) {
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console -- 개발 환경 디버그용
          console.warn(
            '[ResetPasswordFlow] submitPassword called but canSubmit=false'
          )
        }
        return false
      }
      const token = state.emailToken
      setRootError(null)
      dispatch({ type: RESET_PASSWORD_ACTIONS.SUBMIT_START })
      try {
        await authApi.resetPassword({
          emailToken: token,
          newPassword,
        })
        setRootError(null)
        dispatch({ type: RESET_PASSWORD_ACTIONS.SUBMIT_SUCCESS })
        return true
      } catch (err) {
        const mappedError = mapResetPasswordError(err)
        if (mappedError.kind === 'form') {
          setRootError(mappedError.message)
        }
        if (mappedError.kind === 'tokenInvalid') {
          dispatch({
            type: RESET_PASSWORD_ACTIONS.SUBMIT_FAILURE,
            keepToken: false,
          })
        } else {
          dispatch({ type: RESET_PASSWORD_ACTIONS.SUBMIT_FAILURE })
        }
        return false
      }
    },
    [state, setRootError]
  )

  const resetAll = useCallback(() => {
    setRootError(null)
    dispatch({ type: RESET_PASSWORD_ACTIONS.RESET })
  }, [setRootError])

  return {
    state,
    step: state.step,
    canSubmit,
    isSubmitting,
    submitPassword,
    resetAll,
  }
}
