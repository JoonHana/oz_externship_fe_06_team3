// 인증 전역 상태 - login/logout/restore, persist로 localStorage에 저장
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { LoginPayload, User } from '@/types/auth'
import * as authApi from '@/api/auth'
import { refreshToken as callRefreshToken } from '@/api/refresh'
import { normalizeProfileImageUrl } from '@/utils/profileImageUrl'
import {
  clearPersistedAuthState,
  clearManualLogoutMark,
  isManualLogoutMarked,
  markManualLogout,
} from '@/utils/authSessionMarker'

type AuthState = {
  accessToken: string | null
  user: User | null

  /** 넘긴 필드만 반영 (생략한 필드는 기존 값 유지). 리프레시 후 accessToken·user만 갱신할 때 사용 */
  setAuth: (payload: Partial<{
    accessToken: string | null
    user: User | null
  }>) => void
  clearAuth: () => void

  login: (payload: LoginPayload) => Promise<void>
  logout: () => Promise<void>
  restore: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => {
      let restorePromise: Promise<void> | null = null

      return {
        accessToken: null,
        user: null,

        setAuth: (payload) => {
          // 명시적 로그아웃 이후에는 의도치 않은 비동기 setAuth(지연 응답)로 재로그인되는 것을 차단
          if (payload.accessToken && isManualLogoutMarked()) {
            return
          }
          const normalizedPayload: Partial<{
            accessToken: string | null
            user: User | null
          }> = { ...payload }

          if ('user' in payload && payload.user) {
            normalizedPayload.user = {
              ...payload.user,
              profile_img_url: normalizeProfileImageUrl(
                payload.user.profile_img_url
              ),
            }
          }

          set((state) => ({ ...state, ...normalizedPayload }))
        },

        clearAuth: () => {
          set({
            accessToken: null,
            user: null,
          })
        },

        login: async (payload) => {
          try {
            const response = await authApi.login(payload)
            const accessToken = response?.access_token
            if (!accessToken) {
              throw new Error('LOGIN_FAILED')
            }
            const user = await authApi.me(accessToken)
            clearManualLogoutMark()
            get().setAuth({ accessToken, user })
          } catch (error) {
            get().clearAuth()
            throw error
          }
        },

        logout: async () => {
          const currentAccessToken = get().accessToken
          markManualLogout()
          get().clearAuth()

          try {
            await authApi.logout(currentAccessToken)
          } catch {
            // 로그아웃 API 실패 시에도 클라이언트 인증은 초기화
          } finally {
            clearPersistedAuthState()
          }
        },

        restore: async () => {
          if (restorePromise) return restorePromise

          restorePromise = (async () => {
            if (isManualLogoutMarked()) {
              clearPersistedAuthState()
              get().clearAuth()
              return
            }

            const accessToken = get().accessToken
            const user = get().user

            if (accessToken) {
              try {
                const userData = await authApi.me(accessToken)
                get().setAuth({ accessToken, user: userData })
                return
              } catch {
                // accessToken 만료 등: 쿠키로 refresh 시도 (로그인 유지)
              }
            }

            try {
              const newAccessToken = await callRefreshToken()
              const userData = user ?? (await authApi.me(newAccessToken))
              get().setAuth({
                accessToken: newAccessToken,
                user: userData,
              })
            } catch {
              get().clearAuth()
            }
          })().finally(() => {
            restorePromise = null
          })

          return restorePromise
        },
      }
    },
    {
      name: 'auth-storage',
      partialize: (s) => ({
        accessToken: s.accessToken,
        user: s.user,
      }),
    }
  )
)
