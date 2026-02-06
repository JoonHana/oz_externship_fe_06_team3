// 인증 전역 상태 - login/logout/restore, persist로 localStorage에 저장
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { LoginPayload, User } from '@/types/auth'
import * as authApi from '@/api/auth'

type AuthState = {
  accessToken: string | null
  refreshToken: string | null
  user: User | null

  setAuth: (payload: {
    accessToken: string | null
    refreshToken?: string
    user: User
  }) => void
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

      setAuth: ({ accessToken, refreshToken, user }) => {
        set((prev) => ({
          accessToken,
          refreshToken: refreshToken ?? prev.refreshToken,
          user,
        }))
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
          const refreshToken = response?.refresh_token // undefined일 수 있음
          if (!accessToken) {
            throw new Error('LOGIN_FAILED')
          }
          const user = await authApi.me(accessToken)
          // refreshToken이 없으면 setAuth에 undefined로 저장 (별도 API에서 추후 갱신)
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
        if (!accessToken) return

        try {
        const user = await authApi.me(accessToken)
        set({ user })
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
