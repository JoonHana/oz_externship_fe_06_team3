import { ActionRow } from '@/components/signup/ActionRow'
import { Button } from '@/components/common/Button'
import cn from '@/lib/cn'
import { CommonInputField } from '@/components/common/CommonInputField'
import type { FieldState } from '@/components/common/CommonInput'
import type { SignupFormData } from '@/schemas/auth'
import { createDigitsOnlyTransform } from '@/utils/normalize'
import type { FlowMessage } from '@/utils/formMessage'
import {
  getVerificationButtonProps,
  getVerificationCodeRightSlot,
} from './utils'

// 휴대전화 중간/끝 자리수 (4자리)
const PHONE_DIGIT_LENGTH = 4
const PHONE_DIGIT_TRANSFORM = createDigitsOnlyTransform(PHONE_DIGIT_LENGTH)

type TimerLike = {
  isRunning: boolean
  mmss: string
}

function renderFlowMessage(msg: FlowMessage) {
  if (msg.type === 'idle' || !msg.message) return null
  return (
    <p
      className={cn(
        'text-xs font-medium',
        msg.type === 'success' && 'text-success',
        msg.type === 'error' && 'text-error'
      )}
    >
      {msg.message}
    </p>
  )
}

export type PhoneSectionProps = {
  phone1: string
  phoneDigitsState: FieldState
  phoneVerificationCodeFieldState: FieldState

  flowMessage: FlowMessage

  smsVerified: boolean
  smsCodeSent: boolean

  smsTimer: TimerLike
  smsSendLabel: string

  canSendSms: boolean
  canVerifySms: boolean

  onSendSmsCode: () => void
  onVerifySmsCode: () => void
}

export function PhoneSection({
  phone1,
  phoneDigitsState,
  phoneVerificationCodeFieldState,
  flowMessage,
  smsVerified,
  smsCodeSent,
  smsTimer,
  smsSendLabel,
  canSendSms,
  canVerifySms,
  onSendSmsCode,
  onVerifySmsCode,
}: PhoneSectionProps) {
  const canTypeSmsCode = smsCodeSent && !smsVerified
  const showTimerInCodeInput = smsCodeSent && smsTimer.isRunning && !smsVerified

  const sendBtn = getVerificationButtonProps(canSendSms)
  const verifyBtn = getVerificationButtonProps(canVerifySms)

  const smsCodeRightSlot = getVerificationCodeRightSlot({
    verified: smsVerified,
    timerVisible: showTimerInCodeInput,
    mmss: smsTimer.mmss,
  })

  const sendFlowMessage: FlowMessage =
    flowMessage.scope === 'send'
      ? flowMessage
      : { type: 'idle', message: null, scope: null }
  const verifyFlowMessage: FlowMessage =
    flowMessage.scope === 'verify' || flowMessage.scope === 'expired'
      ? flowMessage
      : { type: 'idle', message: null, scope: null }

  const firstRowBelow = renderFlowMessage(sendFlowMessage)
  const secondRowBelow = renderFlowMessage(verifyFlowMessage)

  const phoneDigitInputProps = {
    type: 'text' as const,
    inputMode: 'numeric' as const,
    maxLength: PHONE_DIGIT_LENGTH,
    placeholder: '0000',
    placeholderVariant: 'a' as const,
    locked: smsVerified,
    state: phoneDigitsState,
    width: '100%' as const,
    transformOnChange: PHONE_DIGIT_TRANSFORM,
  }

  const phoneDigitsLeft = (
    <div className="grid w-full min-w-0 grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-1">
      <div className="min-w-0">
        <CommonInputField<SignupFormData>
          name="phone1"
          type="text"
          placeholder={phone1 || '010'}
          placeholderVariant="a"
          disabled
          width="100%"
        />
      </div>
      <span className="text-mono-600 shrink-0 text-[14px]">-</span>
      <div className="min-w-0">
        <CommonInputField<SignupFormData>
          name="phone2"
          {...phoneDigitInputProps}
        />
      </div>
      <span className="text-mono-600 shrink-0 text-[14px]">-</span>
      <div className="min-w-0">
        <CommonInputField<SignupFormData>
          name="phone3"
          {...phoneDigitInputProps}
        />
      </div>
    </div>
  )

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <label className="inline-flex items-start text-left text-[16px] leading-[22.24px] font-normal tracking-[-0.48px] text-[#121212]">
        휴대전화
        <span className="text-[16px] leading-normal font-normal tracking-[-0.32px] text-[#EC0037]">
          *
        </span>
      </label>

      <ActionRow
        left={phoneDigitsLeft}
        right={
          <Button
            type="button"
            size="sm"
            variant={sendBtn.variant}
            disabled={sendBtn.disabled}
            className="whitespace-nowrap"
            onClick={onSendSmsCode}
          >
            {smsSendLabel}
          </Button>
        }
        below={firstRowBelow}
      />

      <ActionRow
        left={
          <CommonInputField<SignupFormData>
            name="phoneVerificationCode"
            type="text"
            placeholder="인증번호 6자리를 입력해주세요"
            width="100%"
            placeholderVariant="a"
            state={phoneVerificationCodeFieldState}
            helperVisibility="always"
            rightSlot={smsCodeRightSlot}
            locked={smsVerified}
            disabled={!canTypeSmsCode}
          />
        }
        right={
          <Button
            type="button"
            size="sm"
            variant={verifyBtn.variant}
            disabled={verifyBtn.disabled}
            className="whitespace-nowrap"
            onClick={onVerifySmsCode}
          >
            {smsVerified ? '인증완료' : '인증번호 확인'}
          </Button>
        }
        below={secondRowBelow}
      />
    </div>
  )
}
