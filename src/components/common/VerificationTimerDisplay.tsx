// 인증 타이머 표시 - codeInput rightSlot용
export function VerificationTimerDisplay({
  formatTime,
}: {
  formatTime: string
}) {
  return (
    <span className="text-error text-xs font-medium whitespace-nowrap">
      {formatTime}
    </span>
  )
}
