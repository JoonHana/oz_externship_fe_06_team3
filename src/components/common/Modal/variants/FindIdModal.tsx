// 아이디 찾기 모달 - 이름/휴대전화 입력 → SMS 인증 → 아이디 찾기
import { FormProvider } from 'react-hook-form'
import type { FindIdFormData } from '@/schemas/modalSchemas'
import { Button } from '@/components/common/Button'
import { CommonInputField } from '@/components/common/CommonInputField'
import { Modal } from '@/components/common/Modal'
import {
  VerificationMessageDisplay,
  VerificationInputWithButton,
} from './verificationModalHelpers'
import {
  useFindIdModalVM,
  type UseFindIdModalVMResult,
  type UseFindIdModalVMOptions,
} from '@/hooks/vm/useFindIdModalVM'

export interface FindIdModalProps extends UseFindIdModalVMOptions {
  isOpen: boolean
}

interface FindIdModalViewProps {
  isOpen: boolean
  vm: UseFindIdModalVMResult
}

function FindIdModalView({ isOpen, vm }: FindIdModalViewProps) {
  const { methods, sections, ui, actions } = vm

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

export function FindIdModal({
  isOpen,
  onClose,
  onFindIdSuccess,
}: FindIdModalProps) {
  const vm = useFindIdModalVM({
    isOpen,
    onClose,
    onFindIdSuccess,
  })

  return <FindIdModalView isOpen={isOpen} vm={vm} />
}
