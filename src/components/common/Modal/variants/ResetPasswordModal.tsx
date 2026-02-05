// 비밀번호 재설정 모달 - 새 비밀번호 입력, emailToken 1회 사용 후 토스트
import { FormProvider } from 'react-hook-form'
import cn from '@/lib/cn'
import type { ResetPasswordFormData } from '@/schemas/modalSchemas'
import { Button } from '@/components/common/Button'
import { Modal } from '@/components/common/Modal'
import { PasswordField } from '@/components/common/PasswordField'
import { ResetPasswordToast } from '@/components/common/Toast'
import { useResetPasswordModalVM } from '@/hooks/vm/useResetPasswordModalVM'

interface ResetPasswordModalProps {
  isOpen: boolean
  onClose: () => void
  // Flow가 수신 후 state에 저장. 1회 사용 후 폐기
  initialToken: string | null
}

export function ResetPasswordModal({
  isOpen,
  onClose,
  initialToken,
}: ResetPasswordModalProps) {
  const vm = useResetPasswordModalVM({
    isOpen,
    onClose,
    initialToken,
  })

  const { methods, sections, ui, actions } = vm

  return (
    <Modal
      isOpen={isOpen}
      onClose={actions.onClose}
      toastPosition="center"
      toast={vm.showToast ? <ResetPasswordToast /> : undefined}
    >
      {!vm.showToast && (
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
