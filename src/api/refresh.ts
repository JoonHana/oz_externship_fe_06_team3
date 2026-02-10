import { apiClient } from '@/api/client'

/** 401 응답 인터셉터에서 리프레시 재시도 무한 루프 방지용 플래그 */
export const REFRESH_REQUEST_CONFIG = { __isRefreshRequest: true } as const

/**
 * accessToken 재발급.
 * - token 없음: 쿠키만 전송 (백엔드가 쿠키에서 읽는 경우).
 * - token 있음: body에 refresh_token 전송 (쿠키 없을 때 fallback).
 */
export async function refreshToken(token?: string): Promise<string> {
  const body = token != null ? { refresh_token: token } : {}
  const { data } = await apiClient.post<{ access_token?: string }>(
    '/api/v1/accounts/me/refresh/',
    body,
    REFRESH_REQUEST_CONFIG as object
  )
  const accessToken = data?.access_token
  if (!accessToken) {
    throw new Error('Refresh response missing access_token')
  }
  return accessToken
}
