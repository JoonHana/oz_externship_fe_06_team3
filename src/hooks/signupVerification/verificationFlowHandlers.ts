// 에러 적용(applyIdentityValidationError), busy 래퍼(withBusy)
import type { Path } from 'react-hook-form'
import type { SignupFormData } from '@/schemas/auth'

export type ValidationResult = {
  ok: boolean
  message?: string
  fieldErrors?: Partial<Record<Path<SignupFormData>, string>>
}

export type ApplyValidationErrorParams = {
  validationResult: ValidationResult
  defaultMessage: string
  identityFields: Path<SignupFormData>[]
  setFieldError: (name: Path<SignupFormData>, message: string) => void
}

export function applyIdentityValidationError({
  validationResult,
  defaultMessage,
  identityFields,
  setFieldError,
}: ApplyValidationErrorParams): void {
  const message = validationResult.message ?? defaultMessage

  if (validationResult.fieldErrors) {
    const entries = Object.entries(validationResult.fieldErrors) as [
      Path<SignupFormData>,
      string,
    ][]
    entries.forEach(([field, errorMessage]) => {
      setFieldError(field, errorMessage)
    })
    return
  }

  identityFields.forEach((field) => setFieldError(field, message))
}

export type CreateBusyWrapperParams = {
  setBusy: (isBusy: boolean) => void
}

export async function withBusy<T>(
  { setBusy }: CreateBusyWrapperParams,
  operation: () => Promise<T>
): Promise<T> {
  setBusy(true)
  try {
    return await operation()
  } finally {
    setBusy(false)
  }
}
