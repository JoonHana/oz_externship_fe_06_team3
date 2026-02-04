import { type ReactNode } from 'react'
import cn from '@/lib/cn'

interface VerificationButtonProps {
  onClick: () => void
  disabled: boolean
  isLoading?: boolean
  children: ReactNode
  className?: string
  variant?: 'primary' | 'gray'
}

export function VerificationButton({
  onClick,
  disabled,
  isLoading = false,
  children,
  className,
  variant = 'primary',
}: VerificationButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isLoading}
      className={cn(
        'h-[48px] w-[112px] rounded-[4px] border text-base',
        'flex items-center justify-center transition-colors',
        variant === 'primary' &&
          'bg-primary hover:bg-primary-hover active:bg-primary-active border-transparent text-white',
        variant === 'gray' &&
          'text-foreground border-gray-300 bg-gray-200 hover:bg-gray-300 active:bg-gray-400',
        'disabled:cursor-not-allowed disabled:border-transparent disabled:bg-gray-200 disabled:text-gray-400',
        className
      )}
    >
      {isLoading ? <span className="text-sm">전송 중...</span> : children}
    </button>
  )
}
