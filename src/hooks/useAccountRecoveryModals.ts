// 아이디/비밀번호 찾기 모달 열기·닫기, 토큰 전달 상태 (LoginPage에서 사용)
import { useState } from 'react'
import type { FindPasswordVerifiedPayload } from '@/hooks/flow'

export function useAccountRecoveryModals() {
  const [isFindIdOpen, setIsFindIdOpen] = useState(false)
  const [isFindIdResultOpen, setIsFindIdResultOpen] = useState(false)
  const [maskedEmail, setMaskedEmail] = useState('')
  const [isFindPasswordOpen, setIsFindPasswordOpen] = useState(false)
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false)
  const [emailToken, setEmailToken] = useState<string | null>(null)

  const closeFindId = () => setIsFindIdOpen(false)
  const closeFindIdResult = () => setIsFindIdResultOpen(false)
  const closeFindPassword = () => setIsFindPasswordOpen(false)
  const closeResetPassword = () => {
    setIsResetPasswordOpen(false)
    setEmailToken(null)
  }

  const openFindId = () => setIsFindIdOpen(true)
  const openFindPassword = () => setIsFindPasswordOpen(true)

  const handleFindIdSuccess = (maskedEmailResult: string) => {
    setIsFindIdOpen(false)
    setMaskedEmail(maskedEmailResult)
    setIsFindIdResultOpen(true)
  }

  const goToFindPasswordFromResult = () => {
    setIsFindIdResultOpen(false)
    setIsFindPasswordOpen(true)
  }

  const openResetPasswordWithToken = (payload: FindPasswordVerifiedPayload) => {
    setIsFindPasswordOpen(false)
    setEmailToken(payload.emailToken)
    setIsResetPasswordOpen(true)
  }

  return {
    modals: {
      findId: { isOpen: isFindIdOpen, close: closeFindId },
      findIdResult: {
        isOpen: isFindIdResultOpen,
        close: closeFindIdResult,
        maskedEmail,
      },
      findPassword: {
        isOpen: isFindPasswordOpen,
        close: closeFindPassword,
      },
      resetPassword: {
        isOpen: isResetPasswordOpen,
        close: closeResetPassword,
        emailToken,
      },
    },
    actions: {
      openFindId,
      handleFindIdSuccess,
      openFindPassword,
      goToFindPasswordFromResult,
      openResetPasswordWithToken,
    },
  }
}
