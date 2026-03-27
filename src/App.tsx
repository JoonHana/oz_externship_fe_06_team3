import { useEffect, useLayoutEffect, useRef } from 'react'
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  useNavigationType,
} from 'react-router-dom'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster } from 'react-hot-toast'

import '@/App.css'
import MockAuthHelpPanel from '@/components/auth/MockAuthHelpPanel'
import LandingPage from '@/pages/LandingPage'
import TestPage from '@/pages/TestPage'
import {
  QuizInvalidAccessPage,
  QuizPage,
  QuizResultPage,
  MyPageQuiz,
} from '@/features/quiz'
import LoginPage from '@/pages/LoginPage'
import SignupPage from '@/pages/SignupPage'
import SignupEmailPage from '@/pages/SignupEmailPage'
import SocialLoginCallbackPage from '@/pages/SocialLoginCallbackPage'
import MyPage from '@/pages/MyPage'
import MainLayout from '@/components/layout/MainLayout'
import { RequireAuth } from '@/components/auth/RequireAuth'
import { useAuthStore } from '@/store/authStore'
import {
  clearPersistedAuthState,
  isManualLogoutMarked,
} from '@/utils/authSessionMarker'
import MyInfo from './components/MyInfo'
import PasswordChange from './components/PasswordChange'

function ScrollToTop() {
  const { pathname } = useLocation()
  const navigationType = useNavigationType()
  const isFirstRenderRef = useRef(true)

  useLayoutEffect(() => {
    // 초기 렌더(새로고침 포함)에서는 브라우저의 기존 스크롤 복원을 유지
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false
      return
    }

    // 뒤로가기/앞으로가기(POP)에서는 사용자의 스크롤 컨텍스트를 보존
    if (navigationType === 'POP') return

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [navigationType, pathname])

  return null
}

function AuthBootstrap() {
  const { pathname } = useLocation()
  const accessToken = useAuthStore((s) => s.accessToken)
  const restore = useAuthStore((s) => s.restore)
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const attemptedRef = useRef(false)

  useEffect(() => {
    if (attemptedRef.current) return
    const isSocialCallbackPath = pathname.startsWith('/auth/callback')

    // 소셜 로그인 콜백에서는 서버가 심어둔 access_token 쿠키를 먼저 읽어야 한다.
    if (isSocialCallbackPath) return

    if (isManualLogoutMarked()) {
      attemptedRef.current = true
      clearPersistedAuthState()
      clearAuth()
      return
    }

    if (accessToken) {
      attemptedRef.current = true
      return
    }

    // persist rehydration 직후 값을 사용하도록 아주 짧게 지연
    const timer = window.setTimeout(() => {
      attemptedRef.current = true
      void restore()
    }, 50)

    return () => window.clearTimeout(timer)
  }, [accessToken, clearAuth, pathname, restore])

  return null
}

function App() {
  return (
    <BrowserRouter>
      <AuthBootstrap />
      <ScrollToTop />
      <MockAuthHelpPanel />
      <Routes>
        {/* 헤더가 포함된 페이지 */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/qna" element={<div>질의응답 페이지</div>} />
          <Route path="/test" element={<TestPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<SocialLoginCallbackPage />} />
          <Route
            path="/auth/callback/:provider"
            element={<SocialLoginCallbackPage />}
          />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/signup/email" element={<SignupEmailPage />} />

          {/* 로그인이 필요한 페이지 */}
          <Route element={<RequireAuth />}>
            <Route path="/mypage" element={<MyPage />}>
              <Route path="quiz" element={<MyPageQuiz />} />
              <Route path="quiz/:deploymentId" element={<QuizInvalidAccessPage />} />
              <Route path="profile" element={<MyInfo />} />
              <Route path="password" element={<PasswordChange />} />
            </Route>
          </Route>
        </Route>

        {/* 헤더가 필요 없는 페이지 (레이아웃 밖으로 배치) */}
        <Route element={<RequireAuth />}>
          <Route path="/quiz" element={<QuizPage />} />
          <Route path="/quiz/:deploymentId" element={<QuizPage />} />
          <Route
            path="/quiz/result/:submissionId"
            element={<QuizResultPage />}
          />
        </Route>
      </Routes>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            border: '1px solid #e5e7eb',
            padding: '12px 16px',
            color: '#111827',
          },
        }}
      />
      <ReactQueryDevtools initialIsOpen={false} />
    </BrowserRouter>
  )
}
export default App
