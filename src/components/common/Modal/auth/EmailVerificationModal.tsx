// 이메일 인증 공용 모달 - 비밀번호 찾기/계정 복구
import { useCallback, useEffect, useState } from 'react'
import { FormProvider, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { FieldState } from '@/components/common/CommonInput'
import {
  findPasswordSchema,
  type FindPasswordFormData,
} from '@/schemas/modalSchemas'
import { AUTH_MESSAGES } from '@/constants/authMessages'
import {
  deriveFieldState,
  deriveVerificationMessageUI,
} from '@/utils/formMessage'
import { parseAxiosError, resolveMessage } from '@/utils/error/axiosErrorParser'
import { useFindPasswordFlow } from '@/hooks/flow'
import {
  useRootErrorBridge,
  useVerificationFieldBridge,
} from '@/hooks/vm/useVerificationFieldHelpers'
import { buildVerificationVerifySection } from '@/components/common/Modal/auth/verificationModalSection'
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

type EmailVerificationIdentitySection = {
  emailInput: {
    name: 'email'
    placeholder: string
    state: FieldState
    helperVisibility: 'always'
    width: number
  }
}

type EmailVerificationVerifySection = {
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

type EmailVerificationSubmitSection = {
  button: {
    label: string
    disabled: boolean
    variant: 'primary' | 'disabled'
  }
  onSubmit: (e?: React.BaseSyntheticEvent) => void
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
  sendSuccess: '* 인증번호를 전송했습니다.',
  verifySuccess: '* 인증이 완료되었습니다.',
  expired: '* 인증 시간이 만료되었습니다. 인증번호를 다시 요청해주세요.',
  verifyRequired: '* 이메일 인증을 완료해주세요.',
  failed: '* 계정 복구에 실패했습니다. 다시 시도해주세요.',
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

const VERIFY_SUCCESS_TOAST_DURATION_MS = 3000

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
      if (parsed.status && parsed.status >= 500)
        return AUTH_MESSAGES.common.serverError
      return messages.failed ?? AUTH_MESSAGES.common.serverError
    })()
    const message = resolveMessage(parsed, {}, fallback)
    setRootError(message)
  } finally {
    setIsSubmitting(false)
  }
}

function useVerifySuccessToast(
  notice: string | null,
  verifySuccessNotice: string
): boolean {
  const [showVerifyToast, setShowVerifyToast] = useState(false)
  useEffect(() => {
    if (notice !== verifySuccessNotice) {
      setShowVerifyToast(false)
      return
    }
    setShowVerifyToast(true)
    const timer = setTimeout(
      () => setShowVerifyToast(false),
      VERIFY_SUCCESS_TOAST_DURATION_MS
    )
    return () => clearTimeout(timer)
  }, [notice, verifySuccessNotice])

  return showVerifyToast
}

type EmailVerificationModalState = {
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
  onClose: () => void
}

function useEmailVerificationModalState({
  isOpen,
  onClose,
  onVerified,
  onSubmitVerified,
  mode = 'findPassword',
}: EmailVerificationModalProps): EmailVerificationModalState {
  // 폼 설정
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

  // 에러 브릿지(루트/인증코드)
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

  // 입력값
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

  // 모드별 메시지/버튼 라벨
  const { messages, buttonLabels } = getEmailVerificationModeConfig(mode)

  // 플로우 (이메일 인증)
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

  // 모달 닫힘 시 초기화
  const reset = methods.reset
  useEffect(() => {
    if (!isOpen) reset()
  }, [isOpen, reset])

  // 인증코드 전송/확인
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

  // 제출 처리 (비밀번호 찾기 / 계정 복구)
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

  // 메시지/UI 상태
  const rootError = errors.root?.message ?? null
  const shouldHideVerifySuccessNotice =
    emailVerificationFlow.notice === messages.verifySuccess
  const noticeForDisplay = shouldHideVerifySuccessNotice
    ? null
    : emailVerificationFlow.notice
  const messageUI = deriveVerificationMessageUI({
    error: rootError ?? emailVerificationFlow.error,
    notice: noticeForDisplay,
    defaultGuide: messages.defaultGuide,
    defaultGuideAfterSend: messages.defaultGuideAfterSend,
    codeSent: emailVerificationFlow.codeSent,
  })
  const showVerifyToast = useVerifySuccessToast(
    emailVerificationFlow.notice,
    messages.verifySuccess
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

  const identitySection: EmailVerificationIdentitySection = {
    emailInput: {
      name: 'email',
      placeholder: '이메일을 입력해주세요',
      state: emailFieldState,
      helperVisibility: 'always',
      width: 240,
    },
  }

  const verifySection: EmailVerificationVerifySection = buildVerificationVerifySection(
    {
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
    }
  )

  const submitSection: EmailVerificationSubmitSection = {
    button: {
      label: buttonLabels.submit,
      disabled: isSubmitDisabled,
      variant: submitVariant,
    },
    onSubmit: methods.handleSubmit(onSubmit),
  }

  return {
    methods,
    sections: {
      identity: identitySection,
      verify: verifySection,
      submit: submitSection,
    },
    ui: {
      displayText: messageUI.displayText,
      isMessageError: messageUI.isMessageError,
      isDefaultGuide: messageUI.isDefaultGuide,
      hasMessage: messageUI.hasMessage,
      showVerifyToast,
    },
    onClose,
  }
}

type EmailVerificationModalViewProps = {
  isOpen: boolean
  modalState: ReturnType<typeof useEmailVerificationModalState>
  header: {
    iconSrc: string
    iconAlt: string
    title: string
  }
}

function EmailVerificationModalView({
  isOpen,
  modalState,
  header,
}: EmailVerificationModalViewProps) {
  const { methods, sections, ui, onClose } = modalState

  // 헤더/안내 메시지
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

  // 이메일 인증 입력 섹션
  const emailInput = (
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
  )

  const codeVerifyInput = (
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
  )

  const verificationFormSection = (
    <Modal.InputRow label="이메일" required>
      <div className="flex flex-col gap-4">
        {emailInput}
        {codeVerifyInput}
      </div>
    </Modal.InputRow>
  )

  // 제출 버튼 섹션
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
      toast={ui.showVerifyToast ? <EmailVerificationToast /> : undefined}
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

export function EmailVerificationModal(props: EmailVerificationModalProps) {
  // 모드별 헤더
  const header =
    props.mode === 'restoreAccount'
      ? {
          iconSrc: '/icons/RestoreAccount.svg',
          iconAlt: '계정 다시 사용하기',
          title: '계정 다시 사용하기',
        }
      : {
          iconSrc: '/icons/FindPW.svg',
          iconAlt: '비밀번호 찾기',
          title: '비밀번호 찾기',
        }

  const modalState = useEmailVerificationModalState(props)
  return (
    <EmailVerificationModalView
      isOpen={props.isOpen}
      modalState={modalState}
      header={header}
    />
  )
}
