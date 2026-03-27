import { Modal } from '../Modal'
import { Button } from '../../Button'

interface QuizEndModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm?: () => void
}

export function QuizEndModal({
  isOpen,
  onClose,
  onConfirm,
}: QuizEndModalProps) {
  const handleConfirm = () => {
    onConfirm?.()
    onClose()
  }

  const renderTitle = () => (
    <h2
      style={{
        fontSize: '18px',
        fontWeight: '600',
        color: '#121212',
        textAlign: 'center',
      }}
    >
      관리자에 의해 시험이{' '}
      <span style={{ color: '#CC0A0A' }}>종료</span> 되었습니다
    </h2>
  )

  const renderSubtitle = () => (
    <p
      style={{
        fontSize: '14px',
        fontWeight: 'normal',
        color: '#303030',
        textAlign: 'center',
        whiteSpace: 'pre-line',
      }}
    >
      {`관리자에 의해 쪽지시험이 비공개 및 종료 되었습니다.
진행 중이던 답안은 저장되지 않으며 결과에 반영되지 않습니다.
쪽지시험 리스트 페이지로 이동 합니다.`}
    </p>
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <Modal.Header>
        <div className="flex flex-col items-center gap-4">
          <img
            src="/icons/quizEnd.svg"
            alt="시험 종료"
            className="h-[60px] w-[60px]"
          />
          {renderTitle()}
          {renderSubtitle()}
        </div>
      </Modal.Header>

      <Modal.Footer>
        <Button
          variant="primary"
          size="md"
          rounded="default"
          className="w-full"
          onClick={handleConfirm}
        >
          확인
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
