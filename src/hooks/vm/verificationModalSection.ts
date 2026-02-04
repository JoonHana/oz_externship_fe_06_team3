// FindId/FindPassword 인증 섹션 UI 빌드 - buildVerificationVerifySection
import React, { type ReactNode } from 'react'
import type { FieldState } from '@/components/common/CommonInput'
import {
  VerificationCheckIcon,
  VerificationTimerDisplay,
} from '@/components/common'
import { AUTH_MESSAGES } from '@/constants/authMessages'

export type VerificationVerifySection = {
  codeInput: {
    name: 'verificationCode'
    placeholder: string
    state: FieldState
    helperVisibility: 'always'
    width: number
    rightSlot: ReactNode
    disabled: boolean
  }
  sendButton: {
    label: string
    disabled: boolean
    isLoading: boolean
    onClick: () => void
  }
  verifyButton: {
    label: string
    disabled: boolean
    isLoading: boolean
    onClick: () => void
  }
}

export type BuildVerifySectionParams = {
  codeFieldState: FieldState
  codeSent: boolean
  verified: boolean
  isActive: boolean
  expired: boolean
  formatTime: string
  canSend: boolean
  canVerify: boolean
  sending: boolean
  verifying: boolean
  sendCodeLabel: string
  verifyLabel: string
  codePlaceholder: string
  handleSendCode: () => void
  handleVerifyCode: () => void
}

export function buildVerificationVerifySection(
  params: BuildVerifySectionParams
): VerificationVerifySection {
  const {
    codeFieldState,
    codeSent,
    verified,
    isActive,
    expired,
    formatTime,
    canSend,
    canVerify,
    sending,
    verifying,
    sendCodeLabel,
    verifyLabel,
    codePlaceholder,
    handleSendCode,
    handleVerifyCode,
  } = params

  const sendLabel = codeSent ? AUTH_MESSAGES.buttons.resend : sendCodeLabel

  return {
    codeInput: {
      name: 'verificationCode',
      placeholder: codePlaceholder,
      state: codeFieldState,
      helperVisibility: 'always',
      width: 240,
      rightSlot: verified
        ? React.createElement(VerificationCheckIcon)
        : isActive && !expired
          ? React.createElement(VerificationTimerDisplay, { formatTime })
          : undefined,
      disabled: !codeSent,
    },
    sendButton: {
      label: sendLabel,
      disabled: !canSend,
      isLoading: sending,
      onClick: handleSendCode,
    },
    verifyButton: {
      label: verifyLabel,
      disabled: !canVerify,
      isLoading: verifying,
      onClick: handleVerifyCode,
    },
  }
}
