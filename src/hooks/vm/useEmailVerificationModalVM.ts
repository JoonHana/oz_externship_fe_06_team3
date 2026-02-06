// ??? ?? ?? ViewModel - Flow + RHF -> sections/ui/actions
import { useCallback, useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AUTH_MESSAGES } from '@/constants/authMessages'
import {
  deriveFieldState,
  deriveVerificationMessageUI,
} from '@/utils/formMessage'
import { parseAxiosError, resolveMessage } from '@/utils/error/axiosErrorParser'
import type { FieldState } from '@/components/common/CommonInput'
import {
  findPasswordSchema,
  type FindPasswordFormData,
} from '@/schemas/modalSchemas'
import { useFindPasswordFlow } from '@/hooks/flow'
import {
  useRootErrorBridge,
  useVerificationFieldBridge,
} from '@/hooks/vm/useVerificationFieldHelpers'
import { buildVerificationVerifySection } from '@/hooks/vm/verificationModalSection'

export type EmailVerificationVerifiedPayload = {
  email: string
  emailToken: string
}

export type EmailVerificationIdentitySection = {
  emailInput: {
    name: 'email'
    placeholder: string
    state: FieldState
    helperVisibility: 'always'
    width: number
  }
}

export type EmailVerificationVerifySection = {
  codeInput: {
    name: 'verificationCode'
    placeholder: string
    state: FieldState
    helperVisibility: 'always'
    width: number
    rightSlot: React.ReactNode
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

export type EmailVerificationSubmitSection = {
  button: {
    label: string
    disabled: boolean
    variant: 'primary' | 'disabled'
  }
  onSubmit: (e?: React.BaseSyntheticEvent) => void
}

export type UseEmailVerificationModalVMResult = {
  methods: ReturnType<typeof useForm<FindPasswordFormData>>
  sections: {
    identity: EmailVerificationIdentitySection
    verify: EmailVerificationVerifySection
    submit: EmailVerificationSubmitSection
  }
  ui: {
    displayText: string
    isMessageError: boolean
    isDefaultGuide: boolean
    hasMessage: boolean
    showVerifyToast: boolean
  }
  actions: {
    resetAll: () => void
    onClose: () => void
  }
}

export type UseEmailVerificationModalVMOptions = {
  isOpen: boolean
  onClose: () => void
  onVerified?: (payload: EmailVerificationVerifiedPayload) => void
  onSubmitVerified?: (payload: EmailVerificationVerifiedPayload) => Promise<void>
  mode?: 'findPassword' | 'restoreAccount'
}

export function useEmailVerificationModalVM({
  isOpen,
  onClose,
  onVerified,
  onSubmitVerified,
  mode = 'findPassword',
}: UseEmailVerificationModalVMOptions): UseEmailVerificationModalVMResult {
  const methods = useForm<FindPasswordFormData>({
    resolver: zodResolver(findPasswordSchema),
    defaultValues: {
      email: '',
      verificationCode: '',
    },
  })

  const {
    trigger,
    formState: { errors },
  } = methods

  const setRootError = useRootErrorBridge(methods)
  const {
    setFieldError: setVerificationFieldError,
    clearFieldError: clearVerificationFieldError,
    setVerificationCodeValue,
  } = useVerificationFieldBridge(methods, 'verificationCode')

  const setFieldError = useCallback(
    (_field: 'verificationCode', message: string) => {
      setVerificationFieldError(message)
    },
    [setVerificationFieldError]
  )

  const clearFieldError = useCallback(
    (_field: 'verificationCode') => {
      clearVerificationFieldError()
    },
    [clearVerificationFieldError]
  )

  const email = useWatch({
    control: methods.control,
    name: 'email',
    defaultValue: '',
  })
  const verificationCode = useWatch({
    control: methods.control,
    name: 'verificationCode',
    defaultValue: '',
  })

  const restoreMessages = {
    defaultGuide: '입력하신 이메일로 인증번호를 보내드릴게요.',
    defaultGuideAfterSend:
      '입력하신 이메일로 인증번호를 전송했어요. 인증번호를 입력해 주세요.',
    sendSuccess: '* 인증번호를 전송했습니다.',
    verifySuccess: '* 인증이 완료되었습니다.',
    expired: '* 인증 시간이 만료되었습니다. 인증번호를 다시 요청해주세요.',
    verifyRequired: '* 이메일 인증을 완료해주세요.',
    failed: '* 계정 복구에 실패했습니다. 다시 시도해주세요.',
  }
  const restoreButtons = {
    sendCode: '인증번호전송',
    verifyCode: '인증번호확인',
    submit: '계정 다시 사용하기',
  }
  const findPasswordMessages = {
    ...AUTH_MESSAGES.findPassword,
    failed: AUTH_MESSAGES.resetPassword.failed,
  }
  const messages =
    mode === 'restoreAccount' ? restoreMessages : findPasswordMessages
  const buttonLabels =
    mode === 'restoreAccount'
      ? restoreButtons
      : AUTH_MESSAGES.buttons.findPassword

  const [isSubmitting, setIsSubmitting] = useState(false)
  const emailVerificationFlow = useFindPasswordFlow({
    email,
    verificationCode,
    isOpen,
    setRootError,
    setFieldError,
    clearFieldError,
    setVerificationCodeValue,
    onVerified,
    sendSuccessNotice: messages.sendSuccess,
    verifySuccessNotice: messages.verifySuccess,
  })

  const reset = methods.reset
  useEffect(() => {
    if (!isOpen) reset()
  }, [isOpen, reset])

  const handleSendCode = useCallback(async () => {
    const isValid = await trigger('email')
    if (!isValid) return
    if (emailVerificationFlow.codeSent) {
      emailVerificationFlow.onResend()
    }
    await emailVerificationFlow.onSend()
  }, [emailVerificationFlow, trigger])

  const handleVerifyCode = useCallback(async () => {
    if (!emailVerificationFlow.codeSent) return
    if (emailVerificationFlow.expired) {
      setFieldError('verificationCode', messages.expired)
      return
    }
    const isValid = await trigger('verificationCode')
    if (!isValid) return
    await emailVerificationFlow.onVerify()
  }, [emailVerificationFlow, messages, setFieldError, trigger])

  const onSubmit = useCallback(
    async (data: FindPasswordFormData) => {
      if (!emailVerificationFlow.canSubmitToReset) {
        setFieldError('verificationCode', messages.verifyRequired)
        return
      }
      if (onSubmitVerified) {
        const token =
          emailVerificationFlow.state.step === 'verified'
            ? emailVerificationFlow.state.token
            : null
        if (!token) return
        setRootError(null)
        setIsSubmitting(true)
        try {
          await onSubmitVerified({ email: data.email, emailToken: token })
        } catch (error) {
          const parsed = parseAxiosError(error)
          const fallback = (() => {
            if (parsed.networkError) return AUTH_MESSAGES.common.networkError
            if (parsed.status && parsed.status >= 500)
              return AUTH_MESSAGES.common.serverError
            return messages.failed ?? AUTH_MESSAGES.common.serverError
          })()
          const message = resolveMessage(parsed, {}, fallback)
          setRootError(message)
        } finally {
          setIsSubmitting(false)
        }
        return
      }
      emailVerificationFlow.submitToReset(data.email)
    },
    [
      emailVerificationFlow,
      messages,
      onSubmitVerified,
      setFieldError,
      setRootError,
    ]
  )

  const rootError = errors.root?.message ?? null
  const noticeForDisplay =
    emailVerificationFlow.notice === messages.verifySuccess
      ? null
      : emailVerificationFlow.notice
  const messageUI = deriveVerificationMessageUI({
    error: rootError ?? emailVerificationFlow.error,
    notice: noticeForDisplay,
    defaultGuide: messages.defaultGuide,
    defaultGuideAfterSend: messages.defaultGuideAfterSend,
    codeSent: emailVerificationFlow.codeSent,
  })
  const [showVerifyToast, setShowVerifyToast] = useState(false)
  useEffect(() => {
    if (emailVerificationFlow.notice !== messages.verifySuccess) return
    setShowVerifyToast(true)
    const timer = setTimeout(() => setShowVerifyToast(false), 3000)
    return () => clearTimeout(timer)
  }, [emailVerificationFlow.notice, messages.verifySuccess])

  const emailFieldState = deriveFieldState({
    hasError: !!errors.email?.message,
    isVerified: false,
  })
  const codeFieldState = deriveFieldState({
    hasError: !!errors.verificationCode?.message,
    isVerified: emailVerificationFlow.verified,
  })

  const resetAll = useCallback(() => {
    methods.reset()
    emailVerificationFlow.resetAll()
  }, [methods, emailVerificationFlow])

  return {
    methods,
    sections: {
      identity: {
        emailInput: {
          name: 'email',
          placeholder: '이메일을 입력해주세요',
          state: emailFieldState,
          helperVisibility: 'always',
          width: 240,
        },
      },
      verify: buildVerificationVerifySection({
        codeFieldState,
        codeSent: emailVerificationFlow.codeSent,
        verified: emailVerificationFlow.verified,
        isActive: emailVerificationFlow.isActive,
        expired: emailVerificationFlow.expired,
        formatTime: emailVerificationFlow.formatTime,
        canSend: emailVerificationFlow.canSend,
        canVerify: emailVerificationFlow.canVerify,
        sending: emailVerificationFlow.sending,
        verifying: emailVerificationFlow.verifying,
        sendCodeLabel: buttonLabels.sendCode,
        verifyLabel: buttonLabels.verifyCode,
        codePlaceholder: '인증코드를 입력해주세요',
        handleSendCode,
        handleVerifyCode,
      }),
      submit: {
        button: {
          label: buttonLabels.submit,
          disabled:
            !emailVerificationFlow.canSubmitToReset ||
            emailVerificationFlow.sending ||
            emailVerificationFlow.verifying ||
            isSubmitting,
          variant:
            !emailVerificationFlow.canSubmitToReset ||
              emailVerificationFlow.sending ||
              emailVerificationFlow.verifying ||
              isSubmitting
              ? 'disabled'
              : 'primary',
        },
        onSubmit: methods.handleSubmit(onSubmit),
      },
    },
    ui: {
      displayText: messageUI.displayText,
      isMessageError: messageUI.isMessageError,
      isDefaultGuide: messageUI.isDefaultGuide,
      hasMessage: messageUI.hasMessage,
      showVerifyToast,
    },
    actions: {
      resetAll,
      onClose,
    },
  }
}

