// 인증 전역 상태 - login/logout/restore, persist로 localStorage에 저장
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { LoginPayload, User } from '@/types/auth'
import * as authApi from '@/api/auth'
import { refreshToken as callRefreshToken } from '@/api/refresh'

type AuthState = {
  accessToken: string | null
  refreshToken: string | null
  user: User | null

  /** 넘긴 필드만 반영 (생략한 필드는 기존 값 유지). 리프레시 후 accessToken·user만 갱신할 때 사용 */
  setAuth: (payload: Partial<{
    accessToken: string | null
    refreshToken: string | null
    user: User | null
  }>) => void
  clearAuth: () => void

  login: (payload: LoginPayload) => Promise<void>
  logout: () => Promise<void>
  restore: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,

      setAuth: (payload) => {
        set((state) => ({ ...state, ...payload }))
      },

      clearAuth: () => {
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
        })
      },

      login: async (payload) => {
        try {
          const response = await authApi.login(payload)
          const accessToken = response?.access_token
          const refreshToken = response?.refresh_token ?? null
          if (!accessToken) {
            throw new Error('LOGIN_FAILED')
          }
          const user = await authApi.me(accessToken)
          get().setAuth({ accessToken, refreshToken, user })
        } catch (error) {
          get().clearAuth()
          throw error
        }
      },

      logout: async () => {
        try {
          await authApi.logout()
        } catch {
          // 로그아웃 API 실패 시에도 클라이언트 인증은 초기화
        } finally {
          get().clearAuth()
        }
      },

      restore: async () => {
        const accessToken = get().accessToken
        const refreshToken = get().refreshToken
        const user = get().user

        if (accessToken) {
          try {
            const userData = await authApi.me(accessToken)
            get().setAuth({ accessToken, refreshToken, user: userData })
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
            refreshToken,
            user: userData,
          })
        } catch {
          get().clearAuth()
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (s) => ({
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
        user: s.user,
      }),
    }
  )
)
