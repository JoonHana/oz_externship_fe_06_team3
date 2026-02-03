// 로그인/회원가입 문구 관리를 위한 플로우 메시지 타입 정의
import type { FieldState } from '@/components/common/CommonInput'

export type FlowMessageScope = 'send' | 'verify' | 'expired' | null

// 플로우 메시지(전송/검증 결과), scope로 표시 위치 결정.
export type FlowMessage = {
  type: 'idle' | 'success' | 'error'
  message: string | null
  scope: FlowMessageScope
}

export const IDLE_FLOW_MESSAGE: FlowMessage = {
  type: 'idle',
  message: null,
  scope: null,
}

// RHF error + flow 상태 기반으로 FieldState 한 곳에서 계산.
export function deriveFieldState(params: {
  hasError: boolean
  isVerified: boolean
  isSuccess?: boolean
}): FieldState {
  const { hasError, isVerified, isSuccess } = params
  if (isVerified || isSuccess) return 'success'
  if (hasError) return 'error'
  return 'default'
}

// 메시지 우선순위 통일 (formError > fieldError > notice)

export type FormMessages<TFields extends string = string> = {
  formError?: string | null
  notice?: string | null
  fieldErrors?: Partial<Record<TFields, string>>
}

// 필드 순서 고정. 첫 번째 에러만 반환 (정책: verificationCode > email > phone > name > newPassword > confirmPassword)
const FIELD_ORDER: readonly string[] = [
  'verificationCode',
  'email',
  'phone',
  'name',
  'newPassword',
  'confirmPassword',
]

// fieldErrors에서 정책 순서대로 첫 번째 에러 문자열 반환
export function firstFieldError(
  fieldErrors?: Partial<Record<string, string>>
): string | null {
  if (!fieldErrors || typeof fieldErrors !== 'object') return null
  for (const key of FIELD_ORDER) {
    const val = fieldErrors[key]
    if (typeof val === 'string' && val.trim()) return val
  }
  const rest = Object.entries(fieldErrors).find(
    ([k]) => !FIELD_ORDER.includes(k)
  )
  return rest && typeof rest[1] === 'string' && rest[1].trim() ? rest[1] : null
}

// 표시용 메시지 1개. 전 화면 동일 우선순위: formError > 첫 번째 fieldError > notice > null
export function pickVisibleMessage(msg: FormMessages): string | null {
  if (msg.formError && msg.formError.trim()) return msg.formError
  const first = firstFieldError(msg.fieldErrors)
  if (first) return first
  if (msg.notice && msg.notice.trim()) return msg.notice
  return null
}

// 레이아웃 고정용. 메시지 없을 때 placeholder(공백) 반환
export const MESSAGE_PLACEHOLDER = '\u00A0'

// visibleMessage + placeholder. 항상 표시할 문자열(공백 포함)
export function toMessageDisplay(visibleMessage: string | null): string {
  return visibleMessage?.trim() ? visibleMessage : MESSAGE_PLACEHOLDER
}
