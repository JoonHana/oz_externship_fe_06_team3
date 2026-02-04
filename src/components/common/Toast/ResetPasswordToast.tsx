// 비밀번호 재설정 성공 시 표시하는 토스트 (ResetPasswordModal에서 사용)
import cn from '@/lib/cn'
import { AUTH_MESSAGES } from '@/constants/authMessages'

interface ResetPasswordToastProps {
  message?: string
  subMessage?: string
  className?: string
}

export function ResetPasswordToast({
  message = AUTH_MESSAGES.resetPassword.toastSuccess,
  subMessage = AUTH_MESSAGES.resetPassword.toastRedirectMessage,
  className,
}: ResetPasswordToastProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex w-[396px] flex-col items-center rounded-2xl bg-white px-6 py-8',
        className
      )}
    >
      <div className="bg-success-500 mb-6 flex size-12 flex-shrink-0 items-center justify-center rounded-full">
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <path
            d="M5 12l5 5 9-14"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div className="flex flex-col items-center gap-2">
        <p className="text-center text-[18px] leading-[22px] font-bold text-gray-900">
          {message}
        </p>
        <p className="text-center text-[14px] leading-[20px] font-normal text-gray-600">
          {subMessage}
        </p>
      </div>
    </div>
  )
}
