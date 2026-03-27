// 회원가입 비밀번호/확인 필드 상태 (일치 여부, success/error)
import { useEffect, useMemo, useRef } from 'react'
import {
  derivePasswordFieldState,
  derivePasswordConfirmState,
  derivePasswordConfirmMessage,
} from '@/utils/signupUtils'

export type PasswordFieldState = 'default' | 'success' | 'error'

export type UseSignupPasswordStateParams = {
  password: string
  passwordConfirm: string
  passwordTouched: boolean
  trigger: (name: 'passwordConfirm') => Promise<boolean>
}

export type UseSignupPasswordStateResult = {
  passwordFieldState: PasswordFieldState
  passwordConfirmState: PasswordFieldState
  passwordConfirmMessage: string | null
}

export function useSignupPasswordState({
  password,
  passwordConfirm,
  passwordTouched,
  trigger,
}: UseSignupPasswordStateParams): UseSignupPasswordStateResult {
  const triggerRef = useRef(trigger)
  triggerRef.current = trigger

  useEffect(() => {
    if (passwordConfirm.trim()) {
      void triggerRef.current('passwordConfirm')
    }
  }, [password, passwordConfirm])

  const passwordFieldState = useMemo(
    () =>
      passwordTouched
        ? derivePasswordFieldState(password)
        : ('default' as PasswordFieldState),
    [passwordTouched, password]
  )

  // 비밀번호 일치 시 바로 success 표시
  const passwordConfirmState = useMemo(
    () => derivePasswordConfirmState(password, passwordConfirm),
    [password, passwordConfirm]
  )

  const passwordConfirmMessage = useMemo(
    () => derivePasswordConfirmMessage(password, passwordConfirm),
    [password, passwordConfirm]
  )

  return {
    passwordFieldState,
    passwordConfirmState,
    passwordConfirmMessage,
  }
}
