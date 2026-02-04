// signupVerification UI 파생 - canSend, canVerify, fieldState 계산
import type { FieldState } from '@/components/common/CommonInput'
import type { VerificationStatus } from './verificationFlowConstants'

export type ComputeUIParams = {
  verified: boolean
  sendStatus: VerificationStatus
  verifyStatus: VerificationStatus
  codeSent: boolean
  code: string
  busy: boolean
  identityValid: boolean
}

export type ComputeUIResult = {
  canSend: boolean
  canVerify: boolean
  fieldState: FieldState
  codeFieldState: FieldState
}

export function mapStatusToFieldState(status: VerificationStatus): FieldState {
  switch (status) {
    case 'success':
      return 'success'
    case 'error':
      return 'error'
    case 'idle':
    case 'pending':
    default:
      return 'default'
  }
}

export function computeVerificationUI(
  params: ComputeUIParams
): ComputeUIResult {
  const {
    verified,
    sendStatus,
    verifyStatus,
    codeSent,
    code,
    busy,
    identityValid,
  } = params

  const canSend =
    identityValid && !busy && !verified && sendStatus !== 'pending'
  const canVerify =
    !!codeSent &&
    !!code?.trim() &&
    !busy &&
    !verified &&
    verifyStatus !== 'pending'

  const fieldState: FieldState = verified
    ? 'success'
    : mapStatusToFieldState(sendStatus)
  const codeFieldState: FieldState = verified
    ? 'success'
    : mapStatusToFieldState(verifyStatus)

  return { canSend, canVerify, fieldState, codeFieldState }
}
