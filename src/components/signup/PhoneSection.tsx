// 회원가입 휴대전화 섹션 - 010-xxxx-xxxx + 인증번호 전송/확인
import { ActionRow } from '@/components/signup/ActionRow'
import { SectionBlock } from '@/components/signup/SectionBlock'
import { Button } from '@/components/common/Button'
import { CommonInputField } from '@/components/common/CommonInputField'
import type { FieldState } from '@/components/common/CommonInput'
import type { SignupFormData } from '@/schemas/auth'
import { createDigitsOnlyTransform } from '@/utils/normalize'
import type { FlowMessage } from '@/utils/formMessage'
import {
  getVerificationButtonProps,
  getVerificationCodeRightSlot,
  renderFlowMessage,
} from './utils'

const PHONE_DIGIT_LENGTH = 4
const PHONE_DIGIT_TRANSFORM = createDigitsOnlyTransform(PHONE_DIGIT_LENGTH)

type TimerLike = {
  isRunning: boolean
  mmss: string
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
  const isCodeInputPhase = smsCodeSent && !smsVerified
  const shouldShowTimer = smsCodeSent && smsTimer.isRunning && !smsVerified

  const sendCodeButtonProps = getVerificationButtonProps(canSendSms)
  const verifyCodeButtonProps = getVerificationButtonProps(canVerifySms)

  const smsCodeRightSlot = getVerificationCodeRightSlot({
    verified: smsVerified,
    timerVisible: shouldShowTimer,
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

  const sendMessageRow = renderFlowMessage(sendFlowMessage)
  const verifyMessageRow = renderFlowMessage(verifyFlowMessage)

  const phoneDigitFieldProps = {
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

  const phoneNumberInputs = (
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
          {...phoneDigitFieldProps}
        />
      </div>
      <span className="text-mono-600 shrink-0 text-[14px]">-</span>
      <div className="min-w-0">
        <CommonInputField<SignupFormData>
          name="phone3"
          {...phoneDigitFieldProps}
        />
      </div>
    </div>
  )

  return (
    <SectionBlock label="휴대전화" className="min-w-0">
      <ActionRow
        left={phoneNumberInputs}
        right={
          <Button
            type="button"
            size="sm"
            variant={sendCodeButtonProps.variant}
            disabled={sendCodeButtonProps.disabled}
            className="whitespace-nowrap"
            onClick={onSendSmsCode}
          >
            {smsSendLabel}
          </Button>
        }
        below={sendMessageRow}
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
            disabled={!isCodeInputPhase}
          />
        }
        right={
          <Button
            type="button"
            size="sm"
            variant={verifyCodeButtonProps.variant}
            disabled={verifyCodeButtonProps.disabled}
            className="whitespace-nowrap"
            onClick={onVerifySmsCode}
          >
            {smsVerified ? '인증완료' : '인증번호 확인'}
          </Button>
        }
        below={verifyMessageRow}
      />
    </SectionBlock>
  )
}
