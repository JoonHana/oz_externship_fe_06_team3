// 아이디/비밀번호 찾기용 VerificationState 타입 + buildVerificationState
export type VerificationStep = 'idle' | 'codeSent' | 'verified'

export type VerificationState<Token = string> =
  | {
      step: 'idle'
      token?: never
      notice: string | null
      error: string | null
    }
  | {
      step: 'codeSent'
      token?: never
      notice: string | null
      error: string | null
    }
  | {
      step: 'verified'
      token: Token
      notice: string | null
      error: string | null
    }

// verification 결과로 VerificationState 파생
export function buildVerificationState<Token>(
  verification: {
    token: Token | null
    codeSent: boolean
    notice: string | null
    error: string | null
  },
  extraError?: string | null
): VerificationState<Token> {
  const error = extraError ?? verification.error
  if (verification.token != null) {
    return {
      step: 'verified',
      token: verification.token,
      notice: verification.notice,
      error,
    }
  }
  if (verification.codeSent) {
    return { step: 'codeSent', notice: verification.notice, error }
  }
  return { step: 'idle', notice: verification.notice, error }
}
