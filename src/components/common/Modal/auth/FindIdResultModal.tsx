// 아이디 찾기 결과 - maskedEmail 표시, 로그인/비밀번호 찾기 버튼
import { Link } from 'react-router-dom'
import { Button } from '@/components/common/Button'
import { Modal } from '@/components/common/Modal'
import cn from '@/lib/cn'
import { maskEmailForDisplay } from '@/utils/emailMask'

interface FindIdResultModalProps {
  isOpen: boolean
  onClose: () => void
  maskedEmail: string
  onFindPasswordClick?: () => void
}

export function FindIdResultModal({
  isOpen,
  onClose,
  maskedEmail,
  onFindPasswordClick,
}: FindIdResultModalProps) {
  const handleFindPasswordClick = () => {
    onClose()
    onFindPasswordClick?.()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <Modal.Header>
        <div className="flex flex-col items-center gap-2">
          <img
            src="/icons/FindId.svg"
            alt="아이디 찾기"
            className="size-[32px]"
          />
          <h2 className="title-l-b text-foreground">아이디 찾기</h2>
          <p className="text-foreground text-center text-[14px] font-normal">
            입력하신 정보와 일치하는 아이디입니다.
          </p>
        </div>
      </Modal.Header>

      <Modal.Body className="pt-0">
        <div className="flex w-full max-w-[360px] flex-col items-center gap-8">
          <div
            className={cn(
              'flex w-full items-center justify-center rounded-[4px] bg-[#F2F2F2] px-6 py-10'
            )}
          >
            <p className="text-foreground text-center text-[18px] leading-[22px] font-bold">
              {maskEmailForDisplay(maskedEmail)}
            </p>
          </div>

          <div className="flex w-full max-w-[348px] justify-center gap-3">
            <Link
              to="/login"
              onClick={onClose}
              className={cn(
                'border-primary text-primary flex h-12 w-[168px] items-center justify-center rounded-[4px] border font-semibold',
                'bg-white hover:bg-gray-50'
              )}
            >
              로그인
            </Link>
            <Button
              type="button"
              variant="primary"
              size="lg"
              className="w-[168px]"
              onClick={handleFindPasswordClick}
            >
              비밀번호 찾기
            </Button>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  )
}
