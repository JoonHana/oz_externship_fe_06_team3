import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import { refreshToken as callRefreshToken } from '@/api/refresh'
import type { User } from '@/types/auth'
import { isManualLogoutMarked } from '@/utils/authSessionMarker'

const LOGIN_PATH = '/login'

type AuthState = {
  accessToken: string | null
  user: User | null
  setAuth: (payload: Partial<{
    accessToken: string | null
    user: User | null
  }>) => void
  clearAuth: () => void
}

/** 인증 초기화 후 로그인 페이지로 이동 */
function clearAuthAndRedirectToLogin(getAuthState: () => AuthState) {
  getAuthState().clearAuth()
  window.location.replace(LOGIN_PATH)
}

/** 재시도 요청 플래그: 재시도된 요청이 또 401이면 refresh 재시도 무한 루프 방지 */
const RETRY_REQUEST_FLAG = '__isRetryRequest' as const

/** 401 시 refresh로 accessToken 갱신 후 실패한 요청 재시도 */
export function setupRefreshInterceptor(
  client: AxiosInstance,
  getAuthState: () => AuthState
) {
  let refreshPromise: Promise<string | null> | null = null

  const id = client.interceptors.response.use(
    (response) => response,
    async (error: {
      config?: InternalAxiosRequestConfig & {
        __isRefreshRequest?: boolean
        __isRetryRequest?: boolean
      }
      response?: { status: number }
    }) => {
      const config = error.config
      if (error.response?.status !== 401 || !config) {
        return Promise.reject(error)
      }

      const state = getAuthState()

      // 리프레시 API 또는 이미 재시도한 요청이 401이면 갱신 시도 없이 로그인으로
      if (config.__isRefreshRequest || config.__isRetryRequest) {
        clearAuthAndRedirectToLogin(getAuthState)
        return Promise.reject(error)
      }

      // 인증 컨텍스트가 없으면(예: 로그인 실패 401) refresh 시도하지 않음
      if (!state.accessToken || isManualLogoutMarked()) {
        return Promise.reject(error)
      }
      const { setAuth } = state

      try {
        if (!refreshPromise) {
          refreshPromise = callRefreshToken()
            .then((newToken) => {
              setAuth({ accessToken: newToken })
              return newToken
            })
            .finally(() => {
              refreshPromise = null
            })
        }
        const newToken = await refreshPromise
        if (!newToken) {
          clearAuthAndRedirectToLogin(getAuthState)
          return Promise.reject(error)
        }

        config.headers = config.headers ?? {}
        config.headers.Authorization = `Bearer ${newToken}`
        ;(config as unknown as Record<string, unknown>)[RETRY_REQUEST_FLAG] = true
        return client.request(config)
      } catch {
        clearAuthAndRedirectToLogin(getAuthState)
        return Promise.reject(error)
      }
    }
  )

  return () => client.interceptors.response.eject(id)
}
