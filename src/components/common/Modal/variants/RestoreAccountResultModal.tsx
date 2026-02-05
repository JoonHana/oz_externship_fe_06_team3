import { Modal } from '@/components/common/Modal'

interface RestoreAccountResultModalProps {
  isOpen: boolean
  onClose: () => void
}

export function RestoreAccountResultModal({
  isOpen,
  onClose,
}: RestoreAccountResultModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <Modal.Header showCloseButton={false}>
        <div className="flex flex-col items-center gap-2">
          <img
            src="/icons/RestoreAccount.svg"
            alt="계정 복구 완료"
            className="size-[32px]"
          />
          <h2 className="title-l-b">계정 복구 완료!</h2>
          <p className="text-center text-sm text-mono-600">
            지금 바로 로그인해 보세요
          </p>
        </div>
      </Modal.Header>
    </Modal>
  )
}
