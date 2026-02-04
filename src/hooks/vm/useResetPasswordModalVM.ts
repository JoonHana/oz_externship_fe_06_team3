// 비밀번호 재설정 모달 VM - emailToken 1회 사용 후 토스트 띄우고 onClose
import React, { useCallback, useEffect, useState } from 'react'
import { AUTH_MESSAGES } from '@/constants/authMessages'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  resetPasswordSchema,
  type ResetPasswordFormData,
} from '@/schemas/modalSchemas'
import { pickVisibleMessage, toMessageDisplay } from '@/utils/formMessage'
import { useResetPasswordFlow } from '@/hooks/flow'

export type ResetPasswordPasswordSection = {
  newPasswordInput: {
    name: 'newPassword'
    placeholder: string
    helperVisibility: 'always'
    width: string
  }
  confirmPasswordInput: {
    name: 'confirmPassword'
    placeholder: string
    helperVisibility: 'always'
    width: string
    autoState: boolean
    showStatusIcon: boolean
    showVisibilityToggle: false
  }
}

export type ResetPasswordSubmitSection = {
  button: {
    label: string
    disabled: boolean
    variant: 'primary' | 'disabled'
  }
  onSubmit: (e?: React.BaseSyntheticEvent) => void
}

export type UseResetPasswordModalVMResult = {
  methods: ReturnType<typeof useForm<ResetPasswordFormData>>
  sections: {
    password: ResetPasswordPasswordSection
    submit: ResetPasswordSubmitSection
  }
  ui: {
    visibleMessage: string | null
    isMessageError: boolean
    messageDisplay: string
    hasMessage: boolean
    hasEmailToken: boolean
    newPasswordLabel: React.ReactNode
  }
  actions: {
    resetAll: () => void
    onClose: () => void
  }
  // 토스트 표시 시 true (모달 useBackdropV2, toast 렌더링용)
  showToast: boolean
}

export type UseResetPasswordModalVMOptions = {
  isOpen: boolean
  onClose: () => void
  // 부모가 전달. Flow가 수신 후 state에 저장, VM은 직접 다루지 않음
  initialToken: string | null
}

export function useResetPasswordModalVM({
  isOpen,
  onClose,
  initialToken,
}: UseResetPasswordModalVMOptions): UseResetPasswordModalVMResult {
  const navigate = useNavigate()
  const [showToast, setShowToast] = useState(false)

  const methods = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onChange',
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  })

  const { setError, clearErrors, formState } = methods

  const setRootError = useCallback(
    (message: string | null) => {
      if (message) setError('root', { type: 'server', message })
      else clearErrors('root')
    },
    [setError, clearErrors]
  )

  const resetPasswordFlow = useResetPasswordFlow({
    initialToken,
    setRootError,
  })

  const resetForm = methods.reset
  const flowResetAll = resetPasswordFlow.resetAll
  useEffect(() => {
    if (!isOpen) {
      setShowToast(false)
      resetForm()
      flowResetAll()
    }
  }, [isOpen, resetForm, flowResetAll])

  useEffect(() => {
    if (!showToast) return
    const id = setTimeout(() => {
      setShowToast(false)
      onClose()
      navigate('/login')
    }, 2500)
    return () => clearTimeout(id)
  }, [showToast, onClose, navigate])

  const onSubmit = useCallback(
    async (data: ResetPasswordFormData) => {
      if (!resetPasswordFlow.canSubmit) return
      clearErrors('root')
      const success = await resetPasswordFlow.submitPassword(data.newPassword)
      if (success) {
        setShowToast(true)
      }
    },
    [resetPasswordFlow, clearErrors]
  )

  const formMessages = {
    formError:
      methods.formState.errors.root?.message ??
      (!initialToken && resetPasswordFlow.step === 'done'
        ? AUTH_MESSAGES.resetPassword.noTokenMessage
        : null),
    fieldErrors: {},
    notice: null,
  }
  const visibleMessage = pickVisibleMessage(formMessages)
  const isMessageError = !!formMessages.formError
  const messageDisplay = toMessageDisplay(visibleMessage)
  const hasMessage = !!visibleMessage?.trim()

  const resetAll = useCallback(() => {
    setShowToast(false)
    resetForm()
    flowResetAll()
  }, [resetForm, flowResetAll])

  return {
    methods,
    sections: {
      password: {
        newPasswordInput: {
          name: 'newPassword',
          placeholder: '비밀번호를 입력해주세요',
          helperVisibility: 'always',
          width: '100%',
        },
        confirmPasswordInput: {
          name: 'confirmPassword',
          placeholder: '비밀번호를 다시 입력해주세요',
          helperVisibility: 'always',
          width: '100%',
          autoState: true,
          showStatusIcon: true,
          showVisibilityToggle: false,
        },
      },
      submit: {
        button: {
          label: resetPasswordFlow.isSubmitting
            ? AUTH_MESSAGES.common.submitBusy
            : AUTH_MESSAGES.resetPassword.submitLabel,
          disabled:
            !resetPasswordFlow.canSubmit ||
            !formState.isValid ||
            resetPasswordFlow.isSubmitting,
          variant:
            resetPasswordFlow.canSubmit &&
            formState.isValid &&
            !resetPasswordFlow.isSubmitting
              ? 'primary'
              : 'disabled',
        },
        onSubmit: methods.handleSubmit(onSubmit),
      },
    },
    ui: {
      visibleMessage,
      isMessageError,
      messageDisplay,
      hasMessage,
      hasEmailToken: resetPasswordFlow.canSubmit,
      newPasswordLabel: React.createElement(
        React.Fragment,
        null,
        React.createElement(
          'span',
          null,
          '새 비밀번호',
          React.createElement('span', { className: 'text-error' }, '*')
        ),
        React.createElement(
          'span',
          { className: 'text-primary text-[14px] font-semibold' },
          AUTH_MESSAGES.password.formatHint
        )
      ),
    },
    actions: {
      resetAll,
      onClose,
    },
    showToast,
  }
}
