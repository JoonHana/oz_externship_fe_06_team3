import { apiClient } from '@/api/client'

/** 401 응답 인터셉터에서 리프레시 재시도 무한 루프 방지용 플래그 */
export const REFRESH_REQUEST_CONFIG = { __isRefreshRequest: true } as const

/**
 * accessToken 재발급.
 * - 쿠키 기반 refresh_token으로 재발급 요청.
 */
export async function refreshToken(): Promise<string> {
  const { data } = await apiClient.post<{ access_token?: string }>(
    '/api/v1/accounts/me/refresh/',
    {},
    REFRESH_REQUEST_CONFIG as object
  )
  const accessToken = data?.access_token
  if (!accessToken) {
    throw new Error('Refresh response missing access_token')
  }
  return accessToken
}
