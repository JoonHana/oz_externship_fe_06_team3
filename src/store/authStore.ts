// 인증 전역 상태 - login/logout/restore, persist로 localStorage에 저장
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { LoginPayload, User } from '@/types/auth'
import * as authApi from '@/api/auth'

type AuthState = {
  accessToken: string | null
  user: User | null
  isAuthenticated: boolean

  setAuth: (payload: { accessToken: string; user: User }) => void
  clearAuth: () => void

  login: (payload: LoginPayload) => Promise<void>
  logout: () => Promise<void>
  restore: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      user: null,
      isAuthenticated: false,

      setAuth: ({ accessToken, user }) => {
        set({ accessToken, user, isAuthenticated: true })
      },

      clearAuth: () => {
        set({ accessToken: null, user: null, isAuthenticated: false })
      },

      login: async (payload) => {
        try {
          const response = await authApi.login(payload)
          const accessToken = response?.access_token
          if (!accessToken) throw new Error('LOGIN_FAILED')

          const user = await authApi.me(accessToken)
          get().setAuth({ accessToken, user })
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
        if (!accessToken) return

        try {
          const user = await authApi.me(accessToken)
          set({ user, isAuthenticated: true })
        } catch {
          get().clearAuth()
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (s) => ({
        accessToken: s.accessToken,
        user: s.user,
        isAuthenticated: s.isAuthenticated,
      }),
    }
  )
)
