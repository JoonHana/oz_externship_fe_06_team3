// 아이디 찾기 모달 ViewModel - Flow + RHF → sections/ui/actions
import { useCallback, useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AUTH_MESSAGES } from '@/constants/authMessages'
import {
  deriveFieldState,
  deriveVerificationMessageUI,
} from '@/utils/formMessage'
import type { FieldState } from '@/components/common/CommonInput'
import { findIdSchema, type FindIdFormData } from '@/schemas/modalSchemas'
import { useFindIdFlow } from '@/hooks/flow'
import {
  useRootErrorBridge,
  useVerificationFieldBridge,
} from '@/hooks/vm/useVerificationFieldHelpers'
import { buildVerificationVerifySection } from '@/hooks/vm/verificationModalSection'

export type FindIdIdentitySection = {
  nameInput: {
    name: 'name'
    placeholder: string
    state: FieldState
    helperVisibility: 'always'
    width: number | string
  }
  phoneInput: {
    name: 'phone'
    placeholder: string
    state: FieldState
    helperVisibility: 'always'
    width: number
  }
}

export type FindIdVerifySection = {
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

export type FindIdSubmitSection = {
  button: {
    label: string
    disabled: boolean
    variant: 'primary' | 'disabled'
  }
  onSubmit: (e?: React.BaseSyntheticEvent) => void
}

export type UseFindIdModalVMResult = {
  methods: ReturnType<typeof useForm<FindIdFormData>>
  sections: {
    identity: FindIdIdentitySection
    verify: FindIdVerifySection
    submit: FindIdSubmitSection
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

export type UseFindIdModalVMOptions = {
  isOpen: boolean
  onClose: () => void
  onFindIdSuccess?: (email: string) => void
}

export function useFindIdModalVM({
  isOpen,
  onClose,
  onFindIdSuccess,
}: UseFindIdModalVMOptions): UseFindIdModalVMResult {
  const methods = useForm<FindIdFormData>({
    resolver: zodResolver(findIdSchema),
    defaultValues: {
      name: '',
      phone: '',
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

  const name = useWatch({
    control: methods.control,
    name: 'name',
    defaultValue: '',
  })
  const phone = useWatch({
    control: methods.control,
    name: 'phone',
    defaultValue: '',
  })
  const verificationCode = useWatch({
    control: methods.control,
    name: 'verificationCode',
    defaultValue: '',
  })

  const findIdFlow = useFindIdFlow({
    name,
    phone,
    verificationCode,
    isOpen,
    setRootError,
    setFieldError,
    clearFieldError,
    setVerificationCodeValue,
  })

  const reset = methods.reset
  useEffect(() => {
    if (!isOpen) reset()
  }, [isOpen, reset])

  const handleSendCode = useCallback(async () => {
    const isValid = await trigger(['name', 'phone'])
    if (!isValid) return
    if (findIdFlow.codeSent) {
      findIdFlow.onResend()
    }
    await findIdFlow.onSend()
  }, [findIdFlow, trigger])

  const handleVerifyCode = useCallback(async () => {
    if (!findIdFlow.codeSent) return
    if (findIdFlow.expired) {
      setFieldError('verificationCode', AUTH_MESSAGES.findId.expired)
      return
    }
    const isValid = await trigger('verificationCode')
    if (!isValid) return
    await findIdFlow.onVerify()
  }, [findIdFlow, setFieldError, trigger])

  const onSubmit = useCallback(
    async (data: FindIdFormData) => {
      if (!findIdFlow.verified) {
        setFieldError('verificationCode', AUTH_MESSAGES.findId.verifyRequired)
        return
      }

      const maskedEmail = await findIdFlow.findMaskedEmail(data.name)
      if (maskedEmail) {
        onFindIdSuccess?.(maskedEmail)
        return
      }
    },
    [findIdFlow, onFindIdSuccess, setFieldError]
  )

  const messageUI = deriveVerificationMessageUI({
    error: findIdFlow.error,
    notice: findIdFlow.notice,
    defaultGuide: AUTH_MESSAGES.findId.defaultGuide,
    defaultGuideAfterSend: AUTH_MESSAGES.findId.defaultGuideAfterSend,
    codeSent: findIdFlow.codeSent,
  })

  const nameFieldState = deriveFieldState({
    hasError: !!errors.name?.message,
    isVerified: false,
  })
  const phoneFieldState = deriveFieldState({
    hasError: !!errors.phone?.message,
    isVerified: false,
  })
  const codeFieldState = deriveFieldState({
    hasError: !!errors.verificationCode?.message,
    isVerified: findIdFlow.verified,
  })

  const resetAll = useCallback(() => {
    methods.reset()
    findIdFlow.resetAll()
  }, [methods, findIdFlow])

  return {
    methods,
    sections: {
      identity: {
        nameInput: {
          name: 'name',
          placeholder: '이름을 입력해주세요',
          state: nameFieldState,
          helperVisibility: 'always',
          width: '100%',
        },
        phoneInput: {
          name: 'phone',
          placeholder: '숫자만 입력해 주세요',
          state: phoneFieldState,
          helperVisibility: 'always',
          width: 240,
        },
      },
      verify: buildVerificationVerifySection({
        codeFieldState,
        codeSent: findIdFlow.codeSent,
        verified: findIdFlow.verified,
        isActive: findIdFlow.isActive,
        expired: findIdFlow.expired,
        formatTime: findIdFlow.formatTime,
        canSend: findIdFlow.canSend,
        canVerify: findIdFlow.canVerify,
        sending: findIdFlow.sending,
        verifying: findIdFlow.verifying,
        sendCodeLabel: AUTH_MESSAGES.buttons.findId.sendCode,
        verifyLabel: AUTH_MESSAGES.buttons.findId.verifyCode,
        codePlaceholder: '인증번호 6자리를 입력해주세요',
        handleSendCode,
        handleVerifyCode,
      }),
      submit: {
        button: {
          label: findIdFlow.isSubmitting
            ? AUTH_MESSAGES.common.submitBusy
            : AUTH_MESSAGES.buttons.findId.submit,
          disabled: !findIdFlow.verified || findIdFlow.isSubmitting,
          variant: !findIdFlow.verified || findIdFlow.isSubmitting ? 'disabled' : 'primary',
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
