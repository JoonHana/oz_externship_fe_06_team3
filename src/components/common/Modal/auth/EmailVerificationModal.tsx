// 이메일 인증 공용 모달 - 비밀번호 찾기/계정 복구
import { FormProvider } from 'react-hook-form'
import type { FindPasswordFormData } from '@/schemas/modalSchemas'
import { Button } from '@/components/common/Button'
import { Modal } from '@/components/common/Modal'
import { EmailVerificationToast } from '@/components/common/Toast'
import {
  VerificationMessageDisplay,
  VerificationInputWithButton,
} from './verificationModalHelpers'
import {
  useEmailVerificationModalVM,
  type UseEmailVerificationModalVMResult,
  type UseEmailVerificationModalVMOptions,
} from '@/hooks/vm/useEmailVerificationModalVM'

export interface EmailVerificationModalProps
  extends UseEmailVerificationModalVMOptions {
  isOpen: boolean
}

interface EmailVerificationModalViewProps {
  isOpen: boolean
  vm: UseEmailVerificationModalVMResult
  header: {
    iconSrc: string
    iconAlt: string
    title: string
  }
}

function EmailVerificationModalView({
  isOpen,
  vm,
  header,
}: EmailVerificationModalViewProps) {
  const { methods, sections, ui, actions } = vm

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
  const identitySection = (
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
      onClose={actions.onClose}
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
            {identitySection}
            {submitSection}
          </form>
        </FormProvider>
      </Modal.Body>
    </Modal>
  )
}

export function EmailVerificationModal({
  isOpen,
  onClose,
  onVerified,
  onSubmitVerified,
  mode = 'findPassword',
}: EmailVerificationModalProps) {
  // 모드별 헤더
  const header =
    mode === 'restoreAccount'
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

  const vm = useEmailVerificationModalVM({
    isOpen,
    onClose,
    onVerified,
    onSubmitVerified,
    mode,
  })

  return <EmailVerificationModalView isOpen={isOpen} vm={vm} header={header} />
}
