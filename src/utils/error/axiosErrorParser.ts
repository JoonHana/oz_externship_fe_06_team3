import axios from 'axios'

export type ParsedAxiosError = {
  isAxiosError: boolean
  status: number | undefined
  detail: string | undefined
  fieldErrors: Record<string, string>
  networkError: boolean
}

type ErrorResponseData = {
  error_detail?: string | Record<string, string | string[]>
  detail?: string
}

function extractFieldErrors(
  ed: string | Record<string, string | string[]> | undefined
): Record<string, string> {
  if (!ed || typeof ed === 'string') return {}
  const result: Record<string, string> = {}
  for (const [key, value] of Object.entries(ed)) {
    if (typeof value === 'string') {
      result[key] = value
    } else if (Array.isArray(value) && typeof value[0] === 'string') {
      result[key] = value[0]
    }
  }
  return result
}

// Axios 에러에서 status, detail, fieldErrors 추출
export function parseAxiosError(err: unknown): ParsedAxiosError {
  if (!axios.isAxiosError(err)) {
    return {
      isAxiosError: false,
      status: undefined,
      detail: undefined,
      fieldErrors: {},
      networkError: false,
    }
  }

  const status = err.response?.status
  const data = err.response?.data as ErrorResponseData | undefined
  const ed = data?.error_detail
  const detail = typeof data?.detail === 'string' ? data.detail : undefined

  let fieldErrors: Record<string, string> = {}
  if (typeof ed === 'string') {
    fieldErrors = { _form: ed }
  } else if (ed && typeof ed === 'object') {
    fieldErrors = extractFieldErrors(ed)
  }

  const networkError = !err.response

  return {
    isAxiosError: true,
    status,
    detail,
    fieldErrors,
    networkError,
  }
}

// 파싱 결과 + byStatus 맵으로 UI 메시지 결정
export function resolveMessage(
  parsed: ParsedAxiosError,
  byStatus: Record<number, string>,
  fallback: string
): string {
  if (!parsed.isAxiosError) return fallback
  if (parsed.status && byStatus[parsed.status]) return byStatus[parsed.status]
  const firstField = Object.values(parsed.fieldErrors)[0]
  if (typeof firstField === 'string') return firstField
  if (parsed.detail) return parsed.detail
  return fallback
}
