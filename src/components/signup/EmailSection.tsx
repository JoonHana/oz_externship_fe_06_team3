// 회원가입 이메일 섹션 - 이메일 입력 + 인증코드 전송/확인
import { ActionRow } from '@/components/signup/ActionRow'
import { SectionBlock } from '@/components/signup/SectionBlock'
import { Button } from '@/components/common/Button'
import { CommonInputField } from '@/components/common/CommonInputField'
import type { FieldState } from '@/components/common/CommonInput'
import type { SignupFormData } from '@/schemas/auth'
import type { FlowMessage } from '@/utils/formMessage'
import {
  getVerificationButtonProps,
  getVerificationCodeRightSlot,
  renderFlowMessage,
} from './utils'

export type EmailSectionProps = {
  emailFieldState: FieldState
  emailVerificationCodeFieldState: FieldState

  flowMessage: FlowMessage

  emailVerified: boolean
  emailCodeSent: boolean

  emailTimer: { mmss: string; isRunning: boolean }

  emailSendLabel: string
  canSendEmail: boolean
  canVerifyEmail: boolean

  onSendEmailCode: () => void
  onVerifyEmailCode: () => void
}

export function EmailSection({
  emailFieldState,
  emailVerificationCodeFieldState,
  flowMessage,
  emailVerified,
  emailCodeSent,
  emailTimer,
  emailSendLabel,
  canSendEmail,
  canVerifyEmail,
  onSendEmailCode,
  onVerifyEmailCode,
}: EmailSectionProps) {
  const isCodePhase = emailCodeSent && !emailVerified
  const sendCodeButtonProps = getVerificationButtonProps(canSendEmail)
  const verifyCodeButtonProps = getVerificationButtonProps(canVerifyEmail)

  const sendMessageRow =
    flowMessage.scope === 'send' ? renderFlowMessage(flowMessage) : null
  const verifyMessageRow =
    flowMessage.scope === 'verify' || flowMessage.scope === 'expired'
      ? renderFlowMessage(flowMessage)
      : null

  return (
    <SectionBlock label="이메일">
      <ActionRow
        left={
          <CommonInputField<SignupFormData>
            name="email"
            type="email"
            placeholder="example@gmail.com"
            width="100%"
            placeholderVariant="a"
            state={emailFieldState}
            helperVisibility="always"
            locked={emailVerified}
            disabled={emailVerified}
            rightSlot={
              emailVerified
                ? getVerificationCodeRightSlot({
                    verified: true,
                    timerVisible: false,
                    mmss: '',
                  })
                : undefined
            }
          />
        }
        right={
          <Button
            type="button"
            size="sm"
            variant={sendCodeButtonProps.variant}
            disabled={sendCodeButtonProps.disabled}
            className="whitespace-nowrap"
            onClick={onSendEmailCode}
          >
            {emailSendLabel}
          </Button>
        }
        below={sendMessageRow}
      />

      <ActionRow
        left={
          <CommonInputField<SignupFormData>
            name="emailVerificationCode"
            type="text"
            placeholder="인증번호를 입력해주세요"
            width="100%"
            placeholderVariant="a"
            state={emailVerificationCodeFieldState}
            helperVisibility="always"
            locked={!isCodePhase}
            disabled={!isCodePhase}
            rightSlot={getVerificationCodeRightSlot({
              verified: emailVerified,
              timerVisible: isCodePhase,
              mmss: emailTimer.mmss,
            })}
          />
        }
        right={
          <Button
            type="button"
            size="sm"
            variant={verifyCodeButtonProps.variant}
            disabled={verifyCodeButtonProps.disabled}
            className="whitespace-nowrap"
            onClick={onVerifyEmailCode}
          >
            인증번호 확인
          </Button>
        }
        below={verifyMessageRow}
      />
    </SectionBlock>
  )
}
