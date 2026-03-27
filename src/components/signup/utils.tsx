// 회원가입 섹션 공통 - renderFlowMessage, getVerificationButtonProps, getVerificationCodeRightSlot
import type { ReactNode } from 'react'
import { Check } from 'lucide-react'
import type { FlowMessage } from '@/utils/formMessage'
import cn from '@/lib/cn'

export function renderFlowMessage(flowMessage: FlowMessage): ReactNode {
  if (flowMessage.type === 'idle' || !flowMessage.message) return null
  return (
    <p
      className={cn(
        'text-xs font-medium',
        flowMessage.type === 'success' && 'text-success',
        flowMessage.type === 'error' && 'text-error'
      )}
    >
      {flowMessage.message}
    </p>
  )
}
// 인증/확인 버튼 props (EmailSection, PhoneSection, NicknameSection 공통)
export function getVerificationButtonProps(canAct: boolean) {
  return {
    variant: canAct ? ('secondary' as const) : ('disabled' as const),
    disabled: !canAct,
  }
}

// 인증코드 입력 rightSlot (EmailSection, PhoneSection 공통)
export function getVerificationCodeRightSlot(params: {
  verified: boolean
  timerVisible: boolean
  mmss: string
}): ReactNode {
  const { verified, timerVisible, mmss } = params
  if (verified) return <Check className="text-success h-5 w-5" />
  if (timerVisible)
    return <span className="text-error text-sm font-semibold">{mmss}</span>
  return null
}
