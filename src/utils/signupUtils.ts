import type { FieldState } from '@/components/common/CommonInput'
import { AUTH_MESSAGES } from '@/constants/authMessages'
import { PASSWORD_REGEX } from '@/schemas/auth'

export function formatBirthday(yyyymmdd: string) {
  const raw = yyyymmdd.replace(/\D/g, '')
  if (raw.length !== 8) return null
  return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`
}

export function mapGender(g: 'male' | 'female'): 'M' | 'F' {
  return g === 'male' ? 'M' : 'F'
}

// 비밀번호 필드 상태 (형식 검증)
export function derivePasswordFieldState(password: string): FieldState {
  const value = password.trim()
  if (!value) return 'default'
  return PASSWORD_REGEX.test(value) ? 'success' : 'error'
}

// 비밀번호 확인 필드 상태
export function derivePasswordConfirmState(
  password: string,
  passwordConfirm: string
): FieldState {
  const pw = password.trim()
  const confirm = passwordConfirm.trim()
  if (!confirm) return 'default'
  if (!pw) return 'error'
  if (!PASSWORD_REGEX.test(pw)) return 'error'
  return confirm === pw ? 'success' : 'error'
}

// 비밀번호 확인 메시지
export function derivePasswordConfirmMessage(
  password: string,
  passwordConfirm: string
): string | null {
  const pw = password.trim()
  const confirm = passwordConfirm.trim()
  if (!confirm) return null
  if (!pw) return AUTH_MESSAGES.password.required
  if (!PASSWORD_REGEX.test(pw)) return AUTH_MESSAGES.password.invalidFormat
  return confirm === pw
    ? AUTH_MESSAGES.password.match
    : AUTH_MESSAGES.password.mismatch
}
