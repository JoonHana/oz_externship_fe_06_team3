import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios'

export function setupAuthInterceptor(
  client: AxiosInstance,
  getAccessToken: () => string | null
) {
  const id = client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      // refresh 요청은 쿠키 기반으로 처리하므로 Authorization 주입 스킵
      const isRefreshRequest = Boolean(
        (
          config as InternalAxiosRequestConfig & {
            __isRefreshRequest?: boolean
          }
        ).__isRefreshRequest
      )
      if (isRefreshRequest) return config

      const token = getAccessToken()
      if (token) {
        config.headers = config.headers ?? {}
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    }
  )

  return () => client.interceptors.request.eject(id)
}
