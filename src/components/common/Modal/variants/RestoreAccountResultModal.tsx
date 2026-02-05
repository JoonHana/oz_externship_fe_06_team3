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
      <Modal.Header showCloseButton={false} className="p-6">
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-[128px] w-[396px] flex-col items-center justify-center gap-2 rounded-2xl bg-white">
            <div className="bg-success-500 mb-2 flex flex-shrink-0 items-center justify-center rounded-full">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="24" height="24" rx="12" fill="#14C786" />
                <path d="M18.33 8L9.85312 16.4769L6 12.6238" stroke="#FAFAFA" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </div>
            <h2 className="text-center text-[18px] leading-[22px] font-bold text-gray-900">
              계정 복구 완료!
            </h2>
            <p className="text-center text-[14px] leading-[20px] font-normal text-gray-600">
              지금 바로 로그인해 보세요
            </p>
          </div>
        </div>
      </Modal.Header>
    </Modal>
  )
}
