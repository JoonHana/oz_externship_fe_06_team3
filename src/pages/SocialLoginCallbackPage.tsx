// 소셜 로그인 콜백 처리 페이지
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/common/Button'
import Loading from '@/components/common/Loading'
import * as authApi from '@/api/auth'
import { useAuthStore } from '@/store/authStore'
import { clearManualLogoutMark } from '@/utils/authSessionMarker'

// access_token 쿠키 조회
const getCookie = (name: string): string | null => {
  const raw = document.cookie
    .split(';')
    .find((cookie) => cookie.trim().startsWith(`${name}=`))
    ?.split('=')
    .slice(1)
    .join('=')

  if (!raw) return null
  return decodeURIComponent(raw)
}

const SOCIAL_ERROR_MESSAGE: Record<string, string> = {
  KAKAO_ERROR_001: '토큰 또는 사용자 정보를 불러오지 못했습니다.',
  KAKAO_ERROR_002: '카카오 로그인 중 알 수 없는 오류가 발생했습니다.',
  NAVER_ERROR_001: '토큰 또는 사용자 정보를 불러오지 못했습니다.',
  NAVER_ERROR_002: '네이버 로그인 중 알 수 없는 오류가 발생했습니다.',
}

export default function SocialLoginCallbackPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const hasRunRef = useRef(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (hasRunRef.current) return
    hasRunRef.current = true

    // 에러 코드 처리
    const params = new URLSearchParams(window.location.search)
    const errorCode = params.get('error_code')

    if (errorCode) {
      setErrorMessage(
        SOCIAL_ERROR_MESSAGE[errorCode] ??
          '소셜 로그인 중 알 수 없는 오류가 발생했습니다.'
      )
      return
    }

    // 토큰 쿠키 확인
    const token = getCookie('access_token')

    if (!token) {
      setErrorMessage('인증 토큰을 찾을 수 없습니다. 다시 로그인해주세요.')
      return
    }

    // 사용자 정보 복구 및 세션 설정
    const restoreSession = async () => {
      try {
        const user = await authApi.me(token)
        clearManualLogoutMark()
        setAuth({ accessToken: token, user })
        navigate('/', { replace: true })
      } catch {
        setErrorMessage(
          '로그인 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.'
        )
      }
    }

    void restoreSession()
  }, [navigate, setAuth])

  if (!errorMessage) {
    return (
      <div className="flex min-h-[calc(100vh-96px)] flex-col items-center justify-center gap-6 bg-white px-4">
        <p className="text-mono-700 text-base">로그인 처리 중입니다.</p>
        <Loading />
      </div>
    )
  }

  return (
    <div className="flex min-h-[calc(100vh-96px)] flex-col items-center justify-center gap-6 bg-white px-4">
      <p className="text-center text-base text-red-500">{errorMessage}</p>
      <Button
        type="button"
        variant="primary"
        className="h-12 w-[220px]"
        onClick={() => navigate('/login', { replace: true })}
      >
        로그인 페이지로 이동
      </Button>
    </div>
  )
}
