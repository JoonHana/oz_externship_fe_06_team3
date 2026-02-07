// 비밀번호 재설정 모달 - 새 비밀번호 입력, emailToken 1회 사용 후 토스트
import React, { useCallback, useEffect, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import cn from '@/lib/cn'
import {
  resetPasswordSchema,
  type ResetPasswordFormData,
} from '@/schemas/modalSchemas'
import { AUTH_MESSAGES } from '@/constants/authMessages'
import { pickVisibleMessage, toMessageDisplay } from '@/utils/formMessage'
import { useResetPasswordFlow } from '@/hooks/flow'
import { Button } from '@/components/common/Button'
import { Modal } from '@/components/common/Modal'
import { PasswordField } from '@/components/common/PasswordField'
import { ResetPasswordToast } from '@/components/common/Toast'

interface ResetPasswordModalProps {
  isOpen: boolean
  onClose: () => void
  // Flow가 수신 후 state에 저장. 1회 사용 후 폐기
  initialToken: string | null
}

const RESET_PASSWORD_SUCCESS_TOAST_DURATION_MS = 2500

type ResetPasswordModalState = {
  methods: ReturnType<typeof useForm<ResetPasswordFormData>>
  sections: {
    password: {
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
    submit: {
      button: {
        label: string
        disabled: boolean
        variant: 'primary' | 'disabled'
      }
      onSubmit: (e?: React.BaseSyntheticEvent) => void
    }
  }
  ui: {
    visibleMessage: string | null
    isMessageError: boolean
    messageDisplay: string
    hasMessage: boolean
    newPasswordLabel: React.ReactNode
  }
  onClose: () => void
  showToast: boolean
}

function useResetPasswordModalState({
  isOpen,
  onClose,
  initialToken,
}: ResetPasswordModalProps): ResetPasswordModalState {
  const navigate = useNavigate()
  const [showToast, setShowToast] = useState(false)

  // 폼 설정
  const methods = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onChange',
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  })

  const { setError, clearErrors, formState } = methods

  // 루트 에러 브릿지
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

  // 모달 닫힘 시 초기화
  const resetForm = methods.reset
  const flowResetAll = resetPasswordFlow.resetAll
  useEffect(() => {
    if (!isOpen) {
      setShowToast(false)
      resetForm()
      flowResetAll()
    }
  }, [isOpen, resetForm, flowResetAll])

  // 완료 토스트 표시
  useEffect(() => {
    if (!showToast) return
    const id = setTimeout(() => {
      setShowToast(false)
      onClose()
      navigate('/login')
    }, RESET_PASSWORD_SUCCESS_TOAST_DURATION_MS)
    return () => clearTimeout(id)
  }, [showToast, onClose, navigate])

  // 제출 처리
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

  // 메시지/UI 상태
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

  // 제출 버튼 상태
  const canSubmit =
    resetPasswordFlow.canSubmit &&
    formState.isValid &&
    !resetPasswordFlow.isSubmitting
  const submitLabel = resetPasswordFlow.isSubmitting
    ? AUTH_MESSAGES.common.submitBusy
    : AUTH_MESSAGES.resetPassword.submitLabel
  const submitVariant: 'primary' | 'disabled' = canSubmit
    ? 'primary'
    : 'disabled'

  return {
    methods,
    sections: {
      password: {
        newPasswordInput: {
          name: 'newPassword' as const,
          placeholder: '비밀번호를 입력해주세요',
          helperVisibility: 'always' as const,
          width: '100%',
        },
        confirmPasswordInput: {
          name: 'confirmPassword' as const,
          placeholder: '비밀번호를 다시 입력해주세요',
          helperVisibility: 'always' as const,
          width: '100%',
          autoState: true,
          showStatusIcon: true,
          showVisibilityToggle: false as const,
        },
      },
      submit: {
        button: {
          label: submitLabel,
          disabled: !canSubmit,
          variant: submitVariant,
        },
        onSubmit: methods.handleSubmit(onSubmit),
      },
    },
    ui: {
      visibleMessage,
      isMessageError,
      messageDisplay,
      hasMessage,
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
    onClose,
    showToast,
  }
}

export function ResetPasswordModal(props: ResetPasswordModalProps) {
  const modalState = useResetPasswordModalState(props)
  const { methods, sections, ui, onClose } = modalState

  // 토스트 표시 시 입력 폼 숨김
  return (
    <Modal
      isOpen={props.isOpen}
      onClose={onClose}
      toastPosition="center"
      toast={modalState.showToast ? <ResetPasswordToast /> : undefined}
    >
      {!modalState.showToast && (
        <>
          <Modal.Header className="pb-0">
            <div className="flex flex-col items-center gap-2">
              <img
                src="/icons/FindPW.svg"
                alt="비밀번호 재설정"
                className="size-[35px]"
              />
              <h2 className="title-l-b">비밀번호 재설정</h2>
              <p className="text-muted text-center text-[14px]">
                신규 비밀번호를 입력해주세요.
              </p>
              <div
                className="flex max-w-[360px] min-w-[192px] items-center justify-center text-center text-[14px] break-words"
                aria-live="polite"
              >
                <span
                  className={cn(
                    ui.hasMessage ? 'visible' : 'invisible',
                    'text-error'
                  )}
                >
                  {ui.messageDisplay}
                </span>
              </div>
            </div>
          </Modal.Header>

          <Modal.Body className="pt-0">
            <FormProvider {...methods}>
              <form
                onSubmit={sections.submit.onSubmit}
                className="flex w-full max-w-[360px] flex-col gap-4"
              >
                <Modal.InputRow label={ui.newPasswordLabel}>
                  <PasswordField<ResetPasswordFormData>
                    name={sections.password.newPasswordInput.name}
                    placeholder={sections.password.newPasswordInput.placeholder}
                    helperVisibility={
                      sections.password.newPasswordInput.helperVisibility
                    }
                    width={sections.password.newPasswordInput.width}
                  />
                </Modal.InputRow>

                <div className="flex flex-col gap-2">
                  <PasswordField<ResetPasswordFormData>
                    name={sections.password.confirmPasswordInput.name}
                    placeholder={
                      sections.password.confirmPasswordInput.placeholder
                    }
                    helperVisibility={
                      sections.password.confirmPasswordInput.helperVisibility
                    }
                    width={sections.password.confirmPasswordInput.width}
                    autoState={sections.password.confirmPasswordInput.autoState}
                    showStatusIcon={
                      sections.password.confirmPasswordInput.showStatusIcon
                    }
                    showVisibilityToggle={
                      sections.password.confirmPasswordInput.showVisibilityToggle
                    }
                  />
                </div>
                <div className="pt-4">
                  <Button
                    type="submit"
                    variant={sections.submit.button.variant}
                    size="xl"
                    className="w-full"
                    disabled={sections.submit.button.disabled}
                  >
                    {sections.submit.button.label}
                  </Button>
                </div>
              </form>
            </FormProvider>
          </Modal.Body>
        </>
      )}
    </Modal>
  )
}
