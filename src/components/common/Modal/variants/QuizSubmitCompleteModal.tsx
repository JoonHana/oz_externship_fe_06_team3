import { Modal } from '../Modal'
import { Button } from '../../Button'

interface QuizSubmitCompleteModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm?: () => void
}

const HEADER_TITLE_STYLE: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 600,
  color: '#121212',
  textAlign: 'center',
}

const HEADER_SUBTITLE_STYLE: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 400,
  color: '#303030',
  textAlign: 'center',
  whiteSpace: 'pre-line',
}

const COMPLETE_COLOR = '#5EB669'

export function QuizSubmitCompleteModal({
  isOpen,
  onClose,
  onConfirm,
}: QuizSubmitCompleteModalProps) {
  const handleConfirm = () => {
    onConfirm?.()
    onClose()
  }

  const renderTitle = () => (
    <h2 style={HEADER_TITLE_STYLE}>
      시험 제출이 <span style={{ color: COMPLETE_COLOR }}>완료</span> 되었습니다
    </h2>
  )

  const renderSubtitle = () => (
    <p style={HEADER_SUBTITLE_STYLE}>
      {`시험이 종료 되었습니다.
시험 제출이 완료 되었습니다!
정답 확인 페이지로 넘어갑니다.`}
    </p>
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="w-[396px] min-h-[341px]">
      <Modal.Header>
        <div className="flex flex-col items-center justify-center gap-4 flex-1 min-h-0">
          <img
            src="/icons/check.svg"
            alt="제출 완료"
            className="h-[60px] w-[60px] shrink-0"
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
