import { type ReactNode, useRef, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import cn from '@/lib/cn'
import { ModalContext, useModalContext } from './useModalContext'

// 모달 스택 관리
let modalStack: string[] = []
let modalIdCounter = 0

// 중첩 모달에서 스크롤락 유지용 ref-count
let bodyScrollLockCount = 0
let previousBodyOverflow: string | null = null

function lockBodyScroll() {
  if (typeof document === 'undefined') return
  if (bodyScrollLockCount === 0) {
    previousBodyOverflow = document.body.style.overflow
  }
  document.body.style.overflow = 'hidden'
  bodyScrollLockCount += 1
}

function unlockBodyScroll() {
  if (typeof document === 'undefined') return
  bodyScrollLockCount = Math.max(0, bodyScrollLockCount - 1)
  if (bodyScrollLockCount === 0) {
    document.body.style.overflow = previousBodyOverflow ?? ''
    previousBodyOverflow = null
  }
}

const generateModalId = () => `modal-${++modalIdCounter}`

const addToStack = (id: string) => {
  modalStack = [...modalStack.filter((m) => m !== id), id]
}

const removeFromStack = (id: string) => {
  modalStack = modalStack.filter((m) => m !== id)
}

const getTopModalId = () => {
  return modalStack.length > 0 ? modalStack[modalStack.length - 1] : null
}

interface ModalProps {
  isOpen: boolean
  onClose?: () => void
  children: ReactNode
  className?: string
  toast?: ReactNode
  toastPosition?: 'top' | 'center' | 'top-far'
  useBackdropV2?: boolean
}

// 모달 컴포넌트 props 타입
export function Modal({
  isOpen,
  onClose,
  children,
  className,
  toast,
  toastPosition = 'top',
  useBackdropV2 = false,
}: ModalProps) {
  const modalRoot = useRef<HTMLElement | null>(null)
  const modalIdRef = useRef<string>(generateModalId())
  useEffect(() => {
    modalRoot.current = document.getElementById('modal-root')
  }, [])

  const [isTopModal, setIsTopModal] = useState(isOpen)

  // 모달 스택 관리
  useEffect(() => {
    if (isOpen) {
      addToStack(modalIdRef.current)
      // 스택에 추가한 후 즉시 top 모달인지 확인
      const checkTop = () => {
        setIsTopModal(getTopModalId() === modalIdRef.current)
      }
      // 즉시 확인
      checkTop()
      // 다음 프레임에서도 확인 (다른 모달과의 경쟁 상황 대비)
      requestAnimationFrame(checkTop)
    } else {
      removeFromStack(modalIdRef.current)
      setIsTopModal(false)
    }
  }, [isOpen])

  // 다른 모달의 상태 변경 감지를 위한 체크
  useEffect(() => {
    if (isOpen) {
      const checkTopModal = () => {
        setIsTopModal(getTopModalId() === modalIdRef.current)
      }
      // 짧은 간격으로 체크
      const interval = setInterval(checkTopModal, 100)
      return () => clearInterval(interval)
    }
  }, [isOpen])

  // 중첩 모달에서 스크롤락 유지
  useEffect(() => {
    if (!isOpen) return
    lockBodyScroll()
    return () => unlockBodyScroll()
  }, [isOpen])

  /** ──────────────── Render helpers ──────────────── */
  const overlayZIndex = 50 + modalStack.length - 1
  const toastZIndex = overlayZIndex + 1
  const inactiveModalZIndex = 50 + modalStack.indexOf(modalIdRef.current)

  const renderBackdropV1 = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 bg-black/50"
      style={{ zIndex: overlayZIndex }}
      onClick={onClose}
    />
  )

  const renderBackdropV2 = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 bg-black/50"
      style={{
        zIndex: overlayZIndex,
        pointerEvents: 'none',
        clipPath: `polygon(
          0% 0%,
          0% 100%,
          calc(50% - 198px) 100%,
          calc(50% - 198px) calc(50% - 64px),
          calc(50% + 198px) calc(50% - 64px),
          calc(50% + 198px) calc(50% + 64px),
          calc(50% - 198px) calc(50% + 64px),
          calc(50% - 198px) 100%,
          100% 100%,
          100% 0%
        )`,
      }}
    />
  )

  const renderToastLayer = () =>
    toast && (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="fixed inset-0 flex items-center justify-center p-4"
        style={{ zIndex: toastZIndex }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={cn(
            'fixed left-1/2 -translate-x-1/2 transform',
            toastPosition === 'top'
              ? 'top-1/2 -translate-y-[calc(50%+20px)]'
              : toastPosition === 'top-far'
                ? 'top-[120px]'
                : 'top-1/2 -translate-y-1/2'
          )}
        >
          {toast}
        </div>
      </motion.div>
    )

  if (!modalRoot.current) return null

  // 맨 위 모달이 아니면 backdrop처럼 처리
  if (isOpen && !isTopModal) {
    return createPortal(
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 bg-black/50"
        style={{ zIndex: inactiveModalZIndex }}
      />,
      modalRoot.current
    )
  }

  return createPortal(
    <AnimatePresence>
      {isOpen && isTopModal && (
        <>
          {/* Backdrop V1 - 기본 전체 화면 오버레이 */}
          {!useBackdropV2 && renderBackdropV1()}
          {/* Backdrop V2 - 토스트 알림창 영역( 정 가운데 영역 396px × 128px, Radius:12px)을 제외한 오버레이 */}
          {useBackdropV2 && renderBackdropV2()}
          {/* 토스트 알림창 (useBackdropV2가 true일 때 맨 앞에 표시, e.stopPropagation() 적용) */}
          {useBackdropV2 && renderToastLayer()}
          {/* Modal Content - 항상 표시, useBackdropV2가 true일 때는 뒤에 배치 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed inset-0 flex items-center justify-center p-4"
            style={{
              zIndex: useBackdropV2
                ? 50 + modalStack.length - 1
                : 50 + modalStack.length,
            }}
          >
            {/* 토스트 알림창 (일반 모달 내부) */}
            {!useBackdropV2 && toast && (
              <div
                className={cn(
                  'pointer-events-none fixed left-1/2 z-[100] -translate-x-1/2 transform',
                  toastPosition === 'top'
                    ? 'top-1/2 -translate-y-[calc(50%+20px)]'
                    : toastPosition === 'top-far'
                      ? 'top-1/2 -translate-y-[calc(50%+270px)]'
                      : 'top-1/2 -translate-y-1/2'
                )}
              >
                {toast}
              </div>
            )}
            <div className="relative">
              {/* useBackdropV2가 true일 때 모달 본체 위에 backdrop overlay */}
              {useBackdropV2 && (
                <div
                  className="absolute inset-0 rounded-lg bg-black/50"
                  style={{ zIndex: 1 }}
                />
              )}
              <div
                className={cn(
                  'max-h-[90vh] w-auto overflow-y-auto rounded-lg bg-white shadow-xl',
                  className
                )}
                style={{
                  position: 'relative',
                  zIndex: useBackdropV2 ? 0 : 'auto',
                }}
              >
                <ModalContext.Provider value={{ onClose }}>
                  {children}
                </ModalContext.Provider>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    modalRoot.current
  )
}

// 모달 헤더 컴포넌트
interface ModalHeaderProps {
  children: ReactNode
  className?: string
  showCloseButton?: boolean
}

Modal.Header = function ModalHeader({
  children,
  className,
  showCloseButton = true,
}: ModalHeaderProps) {
  const { onClose } = useModalContext()

  return (
    <div className={cn('flex flex-col bg-white p-6', className)}>
      {/* 닫기 버튼 - 첫 번째 줄 우측 상단 */}
      {showCloseButton && onClose && (
        <div className="mb-4 flex justify-end">
          <button
            onClick={onClose}
            className="rounded p-1 transition-colors hover:bg-gray-100"
            aria-label="닫기"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="#9D9D9D"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      )}
      {/* 내용 - 두 번째 줄 (이미지, 제목 등) */}
      <div className="flex flex-1 flex-col items-center text-center">
        {children}
      </div>
    </div>
  )
}

// 모달 바디 컴포넌트
interface ModalBodyProps {
  children: ReactNode
  className?: string
}

Modal.Body = function ModalBody({ children, className }: ModalBodyProps) {
  return <div className={cn('bg-white p-6', className)}>{children}</div>
}

// 모달 footer 컴포넌트
interface ModalFooterProps {
  children: ReactNode
  className?: string
}

Modal.Footer = function ModalFooter({ children, className }: ModalFooterProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-end gap-3 p-6',
        className
      )}
    >
      {children}
    </div>
  )
}

// 모달 입력 행 컴포넌트
interface ModalInputRowProps {
  label: string | ReactNode
  required?: boolean
  children: ReactNode
  className?: string
  labelClassName?: string
}

Modal.InputRow = function ModalInputRow({
  label,
  required = false,
  children,
  className,
  labelClassName,
}: ModalInputRowProps) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <label
        className={cn('label-common flex items-center gap-2', labelClassName)}
      >
        {typeof label === 'string' ? (
          <span className="inline-flex items-baseline gap-0">
            {label}
            {required && <span className="text-error">*</span>}
          </span>
        ) : required ? (
          <span className="inline-flex items-baseline gap-0">
            {label}
            <span className="text-error">*</span>
          </span>
        ) : (
          label
        )}
      </label>
      {children}
    </div>
  )
}

// 모달 토스트 컴포넌트
interface ModalToastProps {
  message: string
  isVisible: boolean
  type?: 'success' | 'error' | 'info'
  className?: string
}

Modal.Toast = function ModalToast({
  message,
  isVisible,
  type = 'success',
  className,
}: ModalToastProps) {
  const bgColorMap = {
    success: 'bg-success-50 border-success-200 text-success-800',
    error: 'bg-error-50 border-error-200 text-error-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  }

  if (!isVisible) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={cn(
        'mx-6 mt-6 rounded-lg border p-4',
        bgColorMap[type],
        className
      )}
    >
      {message}
    </motion.div>
  )
}
