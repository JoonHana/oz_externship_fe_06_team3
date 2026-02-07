import { useCallback } from 'react'
import type {
  FieldValues,
  Path,
  PathValue,
  UseFormReturn,
} from 'react-hook-form'

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
