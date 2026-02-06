// FindId/FindPassword 모달 공통 - VerificationInputWithButton, VerificationMessageDisplay
import React from 'react'
import type { Path, FieldValues } from 'react-hook-form'
import cn from '@/lib/cn'
import { CommonInputField } from '@/components/common/CommonInputField'
import { VerificationButton } from '@/components/common/VerificationButton'
import type { FieldState } from '@/components/common/CommonInput'

// 인증 모달 메시지 표시용 props
export interface VerificationMessageDisplayProps {
  displayText: string
  hasMessage: boolean
  isMessageError: boolean
  isDefaultGuide: boolean
}

const MESSAGE_WRAPPER_CLASS =
  'flex max-w-[360px] min-w-[192px] items-center justify-center text-center text-[14px] break-words'
const MESSAGE_ARIA_LIVE = 'polite'

function resolveMessageTextClassName(props: VerificationMessageDisplayProps): string {
  if (!props.hasMessage) return 'invisible'
  if (props.isMessageError) return 'text-error'
  if (props.isDefaultGuide) return 'text-gray-600'
  return 'text-success'
}

// 인증 모달 공통 메시지 영역
export function VerificationMessageDisplay(props: VerificationMessageDisplayProps): React.ReactElement {
  const textClassName = cn(resolveMessageTextClassName(props), 'leading-[20px] font-normal')
  return (
    <div className={MESSAGE_WRAPPER_CLASS} aria-live={MESSAGE_ARIA_LIVE}>
      <span className={textClassName}>{props.displayText}</span>
    </div>
  )
}

// 인증 모달 입력+버튼 쌍용 props
export interface VerificationInputWithButtonProps<T extends FieldValues> {
  input: {
    name: Path<T>
    placeholder: string
    state: FieldState
    helperVisibility: 'always'
    width: number | string
    rightSlot?: React.ReactNode
    disabled?: boolean
  }
  button: {
    onClick: () => void
    disabled: boolean
    isLoading: boolean
    label: string
  }
}

// 인증 모달 공통 입력 필드 + 인증 버튼 쌍
export function VerificationInputWithButton<T extends FieldValues>(
  props: VerificationInputWithButtonProps<T>
): React.ReactElement {
  const { input, button } = props
  return (
    <div className="flex gap-2">
      <CommonInputField<T>
        name={input.name}
        placeholder={input.placeholder}
        state={input.state}
        helperVisibility={input.helperVisibility}
        width={input.width}
        rightSlot={input.rightSlot}
        disabled={input.disabled}
      />
      <VerificationButton
        onClick={button.onClick}
        disabled={button.disabled}
        isLoading={button.isLoading}
      >
        {button.label}
      </VerificationButton>
    </div>
  )
}
