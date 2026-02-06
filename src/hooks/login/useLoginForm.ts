// 로그인 폼 상태 관리 훅 (LoginPage에서 분리)
import { useMemo, useEffect, useRef } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { loginSchema, type LoginFormData } from '@/schemas/auth'
import { AUTH_MESSAGES } from '@/constants/authMessages'

// 사용자가 입력을 바꾸면 에러 메시지를 자동으로 지움
function useClearRootErrorOnInputChange(
  emailValue: string,
  passwordValue: string,
  rootError: string | null,
  clearErrors: (name?: 'root') => void
) {
  const previousFormValuesKeyRef = useRef('')
  useEffect(() => {
    const formValuesKey = `${emailValue}|${passwordValue}`
    if (previousFormValuesKeyRef.current === formValuesKey) return
    previousFormValuesKeyRef.current = formValuesKey
    if (rootError) clearErrors('root')
  }, [emailValue, passwordValue, rootError, clearErrors])
}

/**
 * 로그인 폼 상태 관리 훅
 * - RHF methods (handleSubmit, setError, clearErrors 등)
 * - rootError: 서버 에러 메시지
 * - submitButton: 버튼 상태 (label, disabled, variant)
 */
export function useLoginForm() {
  const methods = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onChange',
    reValidateMode: 'onChange',
    shouldFocusError: true,
  })

  const {
    formState: { errors, isSubmitting, isValid },
    control,
    clearErrors,
  } = methods

  const rootError = errors.root?.message ?? null
  const watchedFormValues = useWatch({ control }) as Partial<LoginFormData>
  const emailValue = (watchedFormValues.email ?? '').toString()
  const passwordValue = (watchedFormValues.password ?? '').toString()

  useClearRootErrorOnInputChange(
    emailValue,
    passwordValue,
    rootError,
    clearErrors
  )

  const submitButton = useMemo(
    () => ({
      label: isSubmitting
        ? AUTH_MESSAGES.login.submitBusy
        : AUTH_MESSAGES.login.submitLabel,
      disabled: !isValid || isSubmitting,
      variant: (!isValid || isSubmitting ? 'disabled' : 'primary') as
        | 'disabled'
        | 'primary',
    }),
    [isValid, isSubmitting]
  )

  return { methods, rootError, submitButton }
}
