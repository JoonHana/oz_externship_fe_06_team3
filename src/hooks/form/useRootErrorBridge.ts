import { useCallback } from 'react'
import type { FieldValues, UseFormReturn } from 'react-hook-form'

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
