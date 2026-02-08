// 이메일 인증 공용 모달 - 비밀번호 찾기/계정 복구
import { useCallback, useEffect, useState } from 'react'
import { FormProvider, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import {
  findPasswordSchema,
  type FindPasswordFormData,
} from '@/schemas/modalSchemas'
import { AUTH_MESSAGES } from '@/constants/authMessages'
import { EMAIL_VERIFY_SUCCESS_TOAST_DURATION_MS } from '@/constants/auth'
import {
  deriveFieldState,
  deriveVerificationMessageUI,
} from '@/utils/formMessage'
import { parseAxiosError, resolveMessage } from '@/utils/error/axiosErrorParser'
import { useFindPasswordFlow } from '@/hooks/flow'
import { useVerificationFieldBridge } from '@/hooks/verification/useVerificationFieldBridge'
import { useRootErrorBridge } from '@/hooks/form/useRootErrorBridge'
import {
  buildVerificationVerifySection,
  type VerificationVerifySection,
} from '@/components/common/Modal/auth/verificationModalSection'
import { Button } from '@/components/common/Button'
import { Modal } from '@/components/common/Modal'
import { EmailVerificationToast } from '@/components/common/Toast'
import {
  VerificationMessageDisplay,
  VerificationInputWithButton,
} from '@/components/common/Modal/auth/verificationModalHelpers'

export type EmailVerificationVerifiedPayload = {
  email: string
  emailToken: string
}

export interface EmailVerificationModalProps {
  isOpen: boolean
  onClose: () => void
  onVerified?: (payload: EmailVerificationVerifiedPayload) => void
  onSubmitVerified?: (payload: EmailVerificationVerifiedPayload) => Promise<void>
  mode?: 'findPassword' | 'restoreAccount'
}

const RESTORE_ACCOUNT_HEADER = {
  iconSrc: '/icons/RestoreAccount.svg',
  iconAlt: '계정 다시 사용하기',
  title: '계정 다시 사용하기',
}

const FIND_PASSWORD_HEADER = {
  iconSrc: '/icons/FindPW.svg',
  iconAlt: '비밀번호 찾기',
  title: '비밀번호 찾기',
}

export function EmailVerificationModal(props: EmailVerificationModalProps) {
  const header =
    props.mode === 'restoreAccount'
      ? RESTORE_ACCOUNT_HEADER
      : FIND_PASSWORD_HEADER

  const modalState = useEmailVerificationModalState(props)

  return (
    <EmailVerificationModalView
      isOpen={props.isOpen}
      modalState={modalState}
      header={header}
    />
  )
}

type EmailVerificationModalState = ReturnType<typeof useEmailVerificationModalState>

function EmailVerificationModalView({
  isOpen,
  modalState,
  header,
}: {
  isOpen: boolean
  modalState: EmailVerificationModalState
  header: {
    iconSrc: string
    iconAlt: string
    title: string
  }
}) {
  const { methods, sections, ui, onClose } = modalState

  const headerSection = (
    <div className="flex flex-col items-center gap-2">
      <img src={header.iconSrc} alt={header.iconAlt} className="size-[32px]" />
      <h2 className="title-l-b">{header.title}</h2>
      <VerificationMessageDisplay
        displayText={ui.displayText}
        hasMessage={ui.hasMessage}
        isMessageError={ui.isMessageError}
        isDefaultGuide={ui.isDefaultGuide}
      />
    </div>
  )

  const verificationFormSection = (
    <Modal.InputRow label="이메일" required>
      <div className="flex flex-col gap-4">
        <VerificationInputWithButton<FindPasswordFormData>
          input={{
            name: sections.identity.emailInput.name,
            placeholder: sections.identity.emailInput.placeholder,
            state: sections.identity.emailInput.state,
            helperVisibility: sections.identity.emailInput.helperVisibility,
            width: sections.identity.emailInput.width,
          }}
          button={{
            onClick: sections.verify.sendButton.onClick,
            disabled: sections.verify.sendButton.disabled,
            isLoading: sections.verify.sendButton.isLoading,
            label: sections.verify.sendButton.label,
          }}
        />
        <VerificationInputWithButton<FindPasswordFormData>
          input={{
            name: sections.verify.codeInput.name,
            placeholder: sections.verify.codeInput.placeholder,
            state: sections.verify.codeInput.state,
            helperVisibility: sections.verify.codeInput.helperVisibility,
            width: sections.verify.codeInput.width,
            rightSlot: sections.verify.codeInput.rightSlot,
            disabled: sections.verify.codeInput.disabled,
          }}
          button={{
            onClick: sections.verify.verifyButton.onClick,
            disabled: sections.verify.verifyButton.disabled,
            isLoading: sections.verify.verifyButton.isLoading,
            label: sections.verify.verifyButton.label,
          }}
        />
      </div>
    </Modal.InputRow>
  )

  const submitSection = (
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
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      toastPosition="top-far"
      toast={ui.showSendToast ? <EmailVerificationToast /> : undefined}
    >
      <Modal.Header>{headerSection}</Modal.Header>

      <Modal.Body className="pt-0">
        <FormProvider {...methods}>
          <form
            onSubmit={sections.submit.onSubmit}
            className="flex w-full max-w-[360px] flex-col gap-4"
          >
            {verificationFormSection}
            {submitSection}
          </form>
        </FormProvider>
      </Modal.Body>
    </Modal>
  )
}

function useEmailVerificationModalState({
  isOpen,
  onClose,
  onVerified,
  onSubmitVerified,
  mode = 'findPassword',
}: EmailVerificationModalProps) {
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

  const { messages, buttonLabels } = getEmailVerificationModeConfig(mode)

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

        await submitVerifiedFlow({
          email: data.email,
          token,
          onSubmitVerified,
          messages,
          setRootError,
          setIsSubmitting,
        })
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
  const shouldHideSendSuccessNotice =
    emailVerificationFlow.notice === messages.sendSuccess
  const noticeForDisplay = shouldHideSendSuccessNotice
    ? null
    : emailVerificationFlow.notice

  const messageUI = deriveVerificationMessageUI({
    error: rootError ?? emailVerificationFlow.error,
    notice: noticeForDisplay,
    defaultGuide: messages.defaultGuide,
    defaultGuideAfterSend: messages.defaultGuideAfterSend,
    codeSent: emailVerificationFlow.codeSent,
  })

  const showSendToast = useSendSuccessToast(
    emailVerificationFlow.notice,
    messages.sendSuccess
  )

  const emailFieldState = deriveFieldState({
    hasError: !!errors.email?.message,
    isVerified: false,
  })
  const codeFieldState = deriveFieldState({
    hasError: !!errors.verificationCode?.message,
    isVerified: emailVerificationFlow.verified,
  })

  const isSubmitDisabled =
    !emailVerificationFlow.canSubmitToReset ||
    emailVerificationFlow.sending ||
    emailVerificationFlow.verifying ||
    isSubmitting

  const submitVariant: 'disabled' | 'primary' = isSubmitDisabled
    ? 'disabled'
    : 'primary'

  return {
    methods,
    sections: {
      identity: {
        emailInput: {
          name: 'email' as const,
          placeholder: '이메일을 입력해주세요',
          state: emailFieldState,
          helperVisibility: 'always' as const,
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
      }) as VerificationVerifySection,
      submit: {
        button: {
          label: buttonLabels.submit,
          disabled: isSubmitDisabled,
          variant: submitVariant,
        },
        onSubmit: methods.handleSubmit(onSubmit),
      },
    },
    ui: {
      displayText: messageUI.displayText,
      isMessageError: messageUI.isMessageError,
      isDefaultGuide: messageUI.isDefaultGuide,
      hasMessage: messageUI.hasMessage,
      showSendToast,
    },
    onClose,
  }
}

type EmailVerificationModeConfig = {
  messages: {
    defaultGuide: string
    defaultGuideAfterSend: string
    sendSuccess: string
    verifySuccess: string
    expired: string
    verifyRequired: string
    failed?: string
  }
  buttonLabels: {
    sendCode: string
    verifyCode: string
    submit: string
  }
}

const RESTORE_MESSAGES: EmailVerificationModeConfig['messages'] = {
  defaultGuide: '입력하신 이메일로 인증번호를 보내드릴게요.',
  defaultGuideAfterSend:
    '입력하신 이메일로 인증번호를 전송했어요. 인증번호를 입력해 주세요.',
  sendSuccess: '인증번호를 전송했습니다.',
  verifySuccess: '인증이 완료되었습니다.',
  expired: '인증 시간이 만료되었습니다. 인증번호를 다시 요청해주세요.',
  verifyRequired: '이메일 인증을 완료해주세요.',
  failed: '계정 복구에 실패했습니다. 다시 시도해주세요.',
}

const RESTORE_BUTTONS: EmailVerificationModeConfig['buttonLabels'] = {
  sendCode: '인증번호전송',
  verifyCode: '인증번호확인',
  submit: '계정 다시 사용하기',
}

const FIND_PASSWORD_MESSAGES: EmailVerificationModeConfig['messages'] = {
  ...AUTH_MESSAGES.findPassword,
  failed: AUTH_MESSAGES.resetPassword.failed,
}

function getEmailVerificationModeConfig(
  mode: 'findPassword' | 'restoreAccount'
): EmailVerificationModeConfig {
  if (mode === 'restoreAccount') {
    return {
      messages: RESTORE_MESSAGES,
      buttonLabels: RESTORE_BUTTONS,
    }
  }

  return {
    messages: FIND_PASSWORD_MESSAGES,
    buttonLabels: AUTH_MESSAGES.buttons.findPassword,
  }
}

type SubmitVerifiedFlowParams = {
  email: string
  token: string
  onSubmitVerified: (payload: EmailVerificationVerifiedPayload) => Promise<void>
  messages: EmailVerificationModeConfig['messages']
  setRootError: (message: string | null) => void
  setIsSubmitting: (value: boolean) => void
}

async function submitVerifiedFlow({
  email,
  token,
  onSubmitVerified,
  messages,
  setRootError,
  setIsSubmitting,
}: SubmitVerifiedFlowParams): Promise<void> {
  setRootError(null)
  setIsSubmitting(true)

  try {
    await onSubmitVerified({ email, emailToken: token })
  } catch (error) {
    const parsed = parseAxiosError(error)
    const fallback = (() => {
      if (parsed.networkError) return AUTH_MESSAGES.common.networkError
      if (parsed.status && parsed.status >= 500) {
        return AUTH_MESSAGES.common.serverError
      }
      return messages.failed ?? AUTH_MESSAGES.common.serverError
    })()

    const message = resolveMessage(parsed, {}, fallback)
    setRootError(message)
  } finally {
    setIsSubmitting(false)
  }
}

function useSendSuccessToast(
  notice: string | null,
  sendSuccessNotice: string
): boolean {
  const [showSendToast, setShowSendToast] = useState(false)

  useEffect(() => {
    if (notice !== sendSuccessNotice) {
      setShowSendToast(false)
      return
    }

    setShowSendToast(true)
    const timer = setTimeout(
      () => setShowSendToast(false),
      EMAIL_VERIFY_SUCCESS_TOAST_DURATION_MS
    )

    return () => clearTimeout(timer)
  }, [notice, sendSuccessNotice])

  return showSendToast
}
