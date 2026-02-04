// 폼 에러 브릿지 - setRootError(→errors.root), verificationCode 필드 에러/값 제어
import { useCallback } from 'react'
import type {
  FieldValues,
  Path,
  PathValue,
  UseFormReturn,
} from 'react-hook-form'

export function useRootErrorBridge<T extends FieldValues>(
  methods: UseFormReturn<T>
) {
  const { setError, clearErrors } = methods

  return useCallback(
    (message: string | null) => {
      if (message) {
        setError('root', { type: 'server', message })
      } else {
        clearErrors('root')
      }
    },
    [setError, clearErrors]
  )
}

export function useVerificationFieldBridge<T extends FieldValues>(
  methods: UseFormReturn<T>,
  field: Path<T>
) {
  const { setError, clearErrors, setValue } = methods

  const setFieldError = useCallback(
    (message: string) => {
      setError(field, { type: 'manual', message })
    },
    [field, setError]
  )

  const clearFieldError = useCallback(() => {
    clearErrors(field)
  }, [clearErrors, field])

  const setVerificationCodeValue = useCallback(
    (value: string) => {
      setValue(field, value as PathValue<T, typeof field>)
    },
    [field, setValue]
  )

  return {
    setFieldError,
    clearFieldError,
    setVerificationCodeValue,
  }
}
