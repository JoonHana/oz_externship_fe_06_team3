// 비밀번호 찾기 모달 - 이메일 입력 → 이메일 인증 → 비밀번호 재설정으로 이동
import { FormProvider } from 'react-hook-form'
import type { FindPasswordFormData } from '@/schemas/modalSchemas'
import { Button } from '@/components/common/Button'
import { Modal } from '@/components/common/Modal'
import {
  VerificationMessageDisplay,
  VerificationInputWithButton,
} from './verificationModalHelpers'
import {
  useFindPasswordModalVM,
  type UseFindPasswordModalVMResult,
  type UseFindPasswordModalVMOptions,
} from '@/hooks/vm/useFindPasswordModalVM'

export interface FindPasswordModalProps extends UseFindPasswordModalVMOptions {
  isOpen: boolean
}

interface FindPasswordModalViewProps {
  isOpen: boolean
  vm: UseFindPasswordModalVMResult
}

function FindPasswordModalView({ isOpen, vm }: FindPasswordModalViewProps) {
  const { methods, sections, ui, actions } = vm

  const headerSection = (
    <div className="flex flex-col items-center gap-2">
      <img
        src="/icons/FindPW.svg"
        alt="비밀번호 찾기"
        className="size-[32px]"
      />
      <h2 className="title-l-b">비밀번호 찾기</h2>
      <VerificationMessageDisplay
        displayText={ui.displayText}
        hasMessage={ui.hasMessage}
        isMessageError={ui.isMessageError}
        isDefaultGuide={ui.isDefaultGuide}
      />
    </div>
  )

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
    <Modal isOpen={isOpen} onClose={actions.onClose}>
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

export function FindPasswordModal({
  isOpen,
  onClose,
  onVerified,
}: FindPasswordModalProps) {
  const vm = useFindPasswordModalVM({
    isOpen,
    onClose,
    onVerified,
  })

  return <FindPasswordModalView isOpen={isOpen} vm={vm} />
}
