// 비밀번호 찾기 모달 ViewModel - Flow + RHF → sections/ui/actions
import { useCallback, useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AUTH_MESSAGES } from '@/constants/authMessages'
import {
  deriveFieldState,
  deriveVerificationMessageUI,
} from '@/utils/formMessage'
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

export type FindPasswordVerifiedPayload = {
  email: string
  emailToken: string
}

export type FindPasswordIdentitySection = {
  emailInput: {
    name: 'email'
    placeholder: string
    state: FieldState
    helperVisibility: 'always'
    width: number
  }
}

export type FindPasswordVerifySection = {
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

export type FindPasswordSubmitSection = {
  button: {
    label: string
    disabled: boolean
    variant: 'primary' | 'disabled'
  }
  onSubmit: (e?: React.BaseSyntheticEvent) => void
}

export type UseFindPasswordModalVMResult = {
  methods: ReturnType<typeof useForm<FindPasswordFormData>>
  sections: {
    identity: FindPasswordIdentitySection
    verify: FindPasswordVerifySection
    submit: FindPasswordSubmitSection
  }
  ui: {
    displayText: string
    isMessageError: boolean
    isDefaultGuide: boolean
    hasMessage: boolean
  }
  actions: {
    resetAll: () => void
    onClose: () => void
  }
}

export type UseFindPasswordModalVMOptions = {
  isOpen: boolean
  onClose: () => void
  onVerified?: (payload: FindPasswordVerifiedPayload) => void
}

export function useFindPasswordModalVM({
  isOpen,
  onClose,
  onVerified,
}: UseFindPasswordModalVMOptions): UseFindPasswordModalVMResult {
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

  const findPasswordFlow = useFindPasswordFlow({
    email,
    verificationCode,
    isOpen,
    setRootError,
    setFieldError,
    clearFieldError,
    setVerificationCodeValue,
    onVerified,
  })

  const reset = methods.reset
  useEffect(() => {
    if (!isOpen) reset()
  }, [isOpen, reset])

  const handleSendCode = useCallback(async () => {
    const isValid = await trigger('email')
    if (!isValid) return
    if (findPasswordFlow.codeSent) {
      findPasswordFlow.onResend()
    }
    await findPasswordFlow.onSend()
  }, [findPasswordFlow, trigger])

  const handleVerifyCode = useCallback(async () => {
    if (!findPasswordFlow.codeSent) return
    if (findPasswordFlow.expired) {
      setFieldError('verificationCode', AUTH_MESSAGES.findPassword.expired)
      return
    }
    const isValid = await trigger('verificationCode')
    if (!isValid) return
    await findPasswordFlow.onVerify()
  }, [findPasswordFlow, setFieldError, trigger])

  const onSubmit = useCallback(
    (data: FindPasswordFormData) => {
      if (!findPasswordFlow.canSubmitToReset) {
        setFieldError(
          'verificationCode',
          AUTH_MESSAGES.findPassword.verifyRequired
        )
        return
      }
      findPasswordFlow.submitToReset(data.email)
    },
    [findPasswordFlow, setFieldError]
  )

  const messageUI = deriveVerificationMessageUI({
    error: findPasswordFlow.error,
    notice: findPasswordFlow.notice,
    defaultGuide: AUTH_MESSAGES.findPassword.defaultGuide,
    defaultGuideAfterSend: AUTH_MESSAGES.findPassword.defaultGuideAfterSend,
    codeSent: findPasswordFlow.codeSent,
  })

  const emailFieldState = deriveFieldState({
    hasError: !!errors.email?.message,
    isVerified: false,
  })
  const codeFieldState = deriveFieldState({
    hasError: !!errors.verificationCode?.message,
    isVerified: findPasswordFlow.verified,
  })

  const resetAll = useCallback(() => {
    methods.reset()
    findPasswordFlow.resetAll()
  }, [methods, findPasswordFlow])

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
        codeSent: findPasswordFlow.codeSent,
        verified: findPasswordFlow.verified,
        isActive: findPasswordFlow.isActive,
        expired: findPasswordFlow.expired,
        formatTime: findPasswordFlow.formatTime,
        canSend: findPasswordFlow.canSend,
        canVerify: findPasswordFlow.canVerify,
        sending: findPasswordFlow.sending,
        verifying: findPasswordFlow.verifying,
        sendCodeLabel: AUTH_MESSAGES.buttons.findPassword.sendCode,
        verifyLabel: AUTH_MESSAGES.buttons.findPassword.verifyCode,
        codePlaceholder: '인증코드를 입력해주세요',
        handleSendCode,
        handleVerifyCode,
      }),
      submit: {
        button: {
          label: AUTH_MESSAGES.buttons.findPassword.submit,
          disabled: !findPasswordFlow.canSubmitToReset || findPasswordFlow.sending || findPasswordFlow.verifying,
          variant:
            !findPasswordFlow.canSubmitToReset || findPasswordFlow.sending || findPasswordFlow.verifying
              ? 'disabled'
              : 'primary',
        },
        onSubmit: methods.handleSubmit(onSubmit),
      },
    },
    ui: messageUI,
    actions: {
      resetAll,
      onClose,
    },
  }
}
