// 탈퇴회원 복구 플로우 모달 상태 관리 (LoginPage에서 분리)
import { useState, useEffect, useCallback } from 'react'
import type { NavigateFunction } from 'react-router-dom'
import { restoreAccount } from '@/api/auth'
import { RESTORE_RESULT_REDIRECT_DELAY_MS } from '@/constants/auth'

type RestoreVerifiedPayload = {
  email: string
  emailToken: string
}

/**
 * 탈퇴회원 복구 흐름을 관리하는 훅
 * - WithdrawnMemberModal: 탈퇴 계정 안내
 * - EmailVerificationModal: 이메일 인증
 * - RestoreAccountResultModal: 복구 완료 결과
 */
export function useWithdrawnMemberFlow(navigate: NavigateFunction) {
  const [withdrawnOpen, setWithdrawnOpen] = useState(false)
  const [restoreOpen, setRestoreOpen] = useState(false)
  const [resultOpen, setResultOpen] = useState(false)

  // 복구 완료 후 2초 뒤 자동으로 닫고 로그인 페이지로 이동
  useEffect(() => {
    if (!resultOpen) return
    const timer = setTimeout(() => {
      setResultOpen(false)
      navigate('/login', { replace: true })
    }, RESTORE_RESULT_REDIRECT_DELAY_MS)
    return () => clearTimeout(timer)
  }, [navigate, resultOpen])

  // 탈퇴회원 안내 모달 열기 (403 에러 시 호출)
  const openWithdrawnModal = useCallback(() => {
    setWithdrawnOpen(true)
  }, [])

  // "계정 복구하기" 버튼 클릭 시: 탈퇴안내 닫고 → 이메일 인증 모달 열기
  const handleStartRestore = useCallback(() => {
    setWithdrawnOpen(false)
    setRestoreOpen(true)
  }, [])

  // 이메일 인증 완료 시: API 호출 → 결과 모달 열기
  const handleRestoreVerified = useCallback(
    async (payload: RestoreVerifiedPayload) => {
      await restoreAccount({ emailToken: payload.emailToken })
      setRestoreOpen(false)
      setResultOpen(true)
    },
    []
  )

  // 각 모달 닫기 핸들러
  const closeWithdrawnModal = useCallback(() => setWithdrawnOpen(false), [])
  const closeRestoreModal = useCallback(() => setRestoreOpen(false), [])
  const closeResultModal = useCallback(() => setResultOpen(false), [])

  return {
    modals: {
      withdrawn: {
        isOpen: withdrawnOpen,
        close: closeWithdrawnModal,
      },
      restore: {
        isOpen: restoreOpen,
        close: closeRestoreModal,
      },
      result: {
        isOpen: resultOpen,
        close: closeResultModal,
      },
    },
    actions: {
      openWithdrawnModal,
      handleStartRestore,
      handleRestoreVerified,
    },
  }
}
