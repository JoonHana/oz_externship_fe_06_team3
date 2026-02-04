import { apiClient } from '@/api/client'

export async function refreshToken(refreshToken: string) {
  const { data } = await apiClient.post<{ access_token: string }>(
    '/api/v1/accounts/me/refresh/',
    { refresh_token: refreshToken }
  )
  return data.access_token
}
