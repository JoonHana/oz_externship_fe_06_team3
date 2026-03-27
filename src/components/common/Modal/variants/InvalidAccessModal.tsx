import { useEffect } from 'react'
import { Modal } from '../Modal'
import { Button } from '../../Button'
import { INVALID_ACCESS_AUTO_REDIRECT_MS } from '@/constants/quiz'

export interface InvalidAccessModalProps {
  isOpen: boolean
  onConfirm: () => void
  /** 자동으로 onConfirm 호출까지의 시간(ms). 0이면 비활성화 */
  autoRedirectMs?: number
}

export function InvalidAccessModal({
  isOpen,
  onConfirm,
  autoRedirectMs = INVALID_ACCESS_AUTO_REDIRECT_MS,
}: InvalidAccessModalProps) {
  useEffect(() => {
    if (!isOpen || autoRedirectMs <= 0) return
    const timer = window.setTimeout(onConfirm, autoRedirectMs)
    return () => window.clearTimeout(timer)
  }, [isOpen, autoRedirectMs, onConfirm])

  return (
    <Modal isOpen={isOpen} onClose={onConfirm}>
      <Modal.Body>
        <div className="flex min-w-[280px] flex-col items-center gap-6 py-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FEE2E2]">
            <span className="text-[28px] text-[#DC2626]" aria-hidden>
              !
            </span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <p className="text-center text-[18px] font-semibold text-foreground">
              잘못된 접근입니다
            </p>
            <p className="text-center text-[14px] text-foreground-secondary">
              쪽지시험 목록에서 참가코드를 입력한 후 응시해 주세요.
            </p>
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="primary"
          size="md"
          rounded="default"
          className="w-full"
          onClick={onConfirm}
        >
          목록으로 이동
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
