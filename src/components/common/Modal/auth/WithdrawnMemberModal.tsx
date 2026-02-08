import { Button } from '@/components/common/Button'
import { Modal } from '@/components/common/Modal'

interface WithdrawnMemberModalProps {
  isOpen: boolean
  onClose: () => void
  onRestoreAccount?: () => void
}

export function WithdrawnMemberModal({
  isOpen,
  onClose,
  onRestoreAccount,
}: WithdrawnMemberModalProps) {
  const handleRestoreAccount = () => {
    onClose()
    onRestoreAccount?.()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <Modal.Header>
        <div className="flex flex-col items-center gap-2">
          <img
            src="/icons/WithdrawnMember.svg"
            alt="탈퇴회원 안내"
            className="size-[32px]"
          />
          <h2 className="title-l-b">탈퇴 회원 안내</h2>
          <p className="text-center text-sm text-mono-600 whitespace-pre-line">
            {`해당 계정은 탈퇴된 상태예요

2025년 6월 20일 이후, 계정 정보는 완전히 삭제돼요.
계정을 다시 사용하려면 아래 버튼을 눌러 복구를 진행해주세요`}
          </p>
        </div>
      </Modal.Header>

      <Modal.Body className="pt-0">
        <div className="pt-4">
          <Button
            variant="primary"
            size="xl"
            className="w-full"
            onClick={handleRestoreAccount}
          >
            계정 다시 사용하기
          </Button>
        </div>
      </Modal.Body>
    </Modal>
  )
}
