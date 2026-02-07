// 아이디 찾기 모달 - 이름/휴대전화 입력 → SMS 인증 → 아이디 찾기
import { useCallback, useEffect } from 'react'
import { FormProvider, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { findIdSchema, type FindIdFormData } from '@/schemas/modalSchemas'
import { AUTH_MESSAGES } from '@/constants/authMessages'
import { Button } from '@/components/common/Button'
import { CommonInputField } from '@/components/common/CommonInputField'
import { Modal } from '@/components/common/Modal'
import {
  deriveFieldState,
  deriveVerificationMessageUI,
} from '@/utils/formMessage'
import {
  useRootErrorBridge,
  useVerificationFieldBridge,
} from '@/hooks/vm/useVerificationFieldHelpers'
import { buildVerificationVerifySection } from '@/hooks/vm/verificationModalSection'
import { useFindIdFlow } from '@/hooks/flow'
import {
  VerificationMessageDisplay,
  VerificationInputWithButton,
} from './verificationModalHelpers'

export interface FindIdModalProps {
  isOpen: boolean
  onClose: () => void
  onFindIdSuccess?: (email: string) => void
}

type FindIdModalState = {
  methods: ReturnType<typeof useForm<FindIdFormData>>
  sections: {
    identity: {
      nameInput: {
        name: 'name'
        placeholder: string
        state: 'default' | 'error' | 'success'
        helperVisibility: 'always'
        width: number | string
      }
      phoneInput: {
        name: 'phone'
        placeholder: string
        state: 'default' | 'error' | 'success'
        helperVisibility: 'always'
        width: number
      }
    }
    verify: ReturnType<typeof buildVerificationVerifySection>
    submit: {
      button: {
        label: string
        disabled: boolean
        variant: 'primary' | 'disabled'
      }
      onSubmit: (e?: React.BaseSyntheticEvent) => void
    }
  }
  ui: ReturnType<typeof deriveVerificationMessageUI>
  onClose: () => void
}

function useFindIdModalState({
  isOpen,
  onClose,
  onFindIdSuccess,
}: FindIdModalProps): FindIdModalState {
  // 폼 설정
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

  // 플로우
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

  // 모달 닫힘 시 초기화
  const reset = methods.reset
  useEffect(() => {
    if (!isOpen) reset()
  }, [isOpen, reset])

  // 인증코드 전송/확인
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

  // 아이디 찾기 제출
  const onSubmit = useCallback(
    async (data: FindIdFormData) => {
      if (!findIdFlow.verified) {
        setFieldError('verificationCode', AUTH_MESSAGES.findId.verifyRequired)
        return
      }

      const maskedEmail = await findIdFlow.findMaskedEmail(data.name)
      if (maskedEmail) {
        onFindIdSuccess?.(maskedEmail)
      }
    },
    [findIdFlow, onFindIdSuccess, setFieldError]
  )

  // 메시지/UI 상태
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

  const submitLabel = findIdFlow.isSubmitting
    ? AUTH_MESSAGES.common.submitBusy
    : AUTH_MESSAGES.buttons.findId.submit
  const isSubmitDisabled = !findIdFlow.verified || findIdFlow.isSubmitting
  const submitVariant: 'disabled' | 'primary' = isSubmitDisabled
    ? 'disabled'
    : 'primary'

  return {
    methods,
    sections: {
      identity: {
        nameInput: {
          name: 'name' as const,
          placeholder: '이름을 입력해주세요',
          state: nameFieldState,
          helperVisibility: 'always' as const,
          width: '100%',
        },
        phoneInput: {
          name: 'phone' as const,
          placeholder: '숫자만 입력해 주세요',
          state: phoneFieldState,
          helperVisibility: 'always' as const,
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
          label: submitLabel,
          disabled: isSubmitDisabled,
          variant: submitVariant,
        },
        onSubmit: methods.handleSubmit(onSubmit),
      },
    },
    ui: messageUI,
    onClose,
  }
}

type FindIdModalViewProps = {
  isOpen: boolean
  modalState: ReturnType<typeof useFindIdModalState>
}

function FindIdModalView({ isOpen, modalState }: FindIdModalViewProps) {
  const { methods, sections, ui, onClose } = modalState

  // 헤더/안내 메시지
  const headerSection = (
    <div className="flex flex-col items-center gap-2">
      <img src="/icons/FindId.svg" alt="아이디 찾기" className="size-[32px]" />
      <h2 className="title-l-b text-foreground">아이디 찾기</h2>
      <VerificationMessageDisplay
        displayText={ui.displayText}
        hasMessage={ui.hasMessage}
        isMessageError={ui.isMessageError}
        isDefaultGuide={ui.isDefaultGuide}
      />
    </div>
  )

  // 이름 입력 섹션
  const identitySection = (
    <Modal.InputRow
      label="이름"
      required
      labelClassName="text-[16px] font-semibold text-foreground"
      className="gap-2"
    >
      <CommonInputField<FindIdFormData>
        name={sections.identity.nameInput.name}
        placeholder={sections.identity.nameInput.placeholder}
        state={sections.identity.nameInput.state}
        helperVisibility={sections.identity.nameInput.helperVisibility}
        width={sections.identity.nameInput.width}
      />
    </Modal.InputRow>
  )

  // 휴대전화 인증 섹션
  const verifySection = (
    <Modal.InputRow
      label="휴대전화"
      required
      labelClassName="text-[16px] font-semibold text-foreground"
      className="gap-2"
    >
      <div className="flex flex-col gap-3">
        <VerificationInputWithButton<FindIdFormData>
          input={{
            name: sections.identity.phoneInput.name,
            placeholder: sections.identity.phoneInput.placeholder,
            state: sections.identity.phoneInput.state,
            helperVisibility: sections.identity.phoneInput.helperVisibility,
            width: sections.identity.phoneInput.width,
          }}
          button={{
            onClick: sections.verify.sendButton.onClick,
            disabled: sections.verify.sendButton.disabled,
            isLoading: sections.verify.sendButton.isLoading,
            label: sections.verify.sendButton.label,
          }}
        />
        <VerificationInputWithButton<FindIdFormData>
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
    <Modal isOpen={isOpen} onClose={onClose}>
      <Modal.Header>{headerSection}</Modal.Header>

      <Modal.Body className="pt-0">
        <FormProvider {...methods}>
          <form
            onSubmit={sections.submit.onSubmit}
            className="flex w-full max-w-[360px] flex-col gap-6"
          >
            {identitySection}
            {verifySection}
            {submitSection}
          </form>
        </FormProvider>
      </Modal.Body>
    </Modal>
  )
}

export function FindIdModal(props: FindIdModalProps) {
  const modalState = useFindIdModalState(props)
  return <FindIdModalView isOpen={props.isOpen} modalState={modalState} />
}
