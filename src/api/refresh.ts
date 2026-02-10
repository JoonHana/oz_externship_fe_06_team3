import { apiClient } from '@/api/client'

/** 401 응답 인터셉터에서 리프레시 재시도 무한 루프 방지용 플래그 */
export const REFRESH_REQUEST_CONFIG = { __isRefreshRequest: true } as const

/** 쿠키에 담긴 refresh 토큰으로 accessToken 재발급 (body 없이 withCredentials만 사용) */
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
