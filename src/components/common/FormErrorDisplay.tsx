// 폼 에러 메시지 표시 (로그인/회원가입 공통)
import cn from '@/lib/cn'

export function FormErrorDisplay({
  message,
  className,
}: {
  message: string | null
  className?: string
}) {
  return (
    <span
      className={cn(
        'text-error min-h-[16px] px-1 text-xs font-medium',
        message ? 'visible' : 'invisible',
        className
      )}
    >
      {message ?? '\u00A0'}
    </span>
  )
}
