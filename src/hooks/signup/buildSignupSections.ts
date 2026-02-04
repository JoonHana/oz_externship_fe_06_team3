// 회원가입 섹션 props 빌드 - EmailSection, PhoneSection, NicknameSection 등에 넘길 데이터
import { AUTH_MESSAGES } from '@/constants/authMessages'
import { deriveFieldState, type FlowMessage } from '@/utils/formMessage'
import type { Status } from '@/hooks/useVerificationFlow'

export type NicknameSectionProps = {
  nicknameFieldState: ReturnType<typeof deriveFieldState>
  flowMessage: FlowMessage
  nicknameChecked: boolean
  nickname: string
  canCheckNickname: boolean
  busy: boolean
  onCheckNickname: () => void
}

export type EmailSectionProps = {
  emailFieldState: ReturnType<typeof deriveFieldState>
  emailVerificationCodeFieldState: ReturnType<typeof deriveFieldState>
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

export type SmsSectionProps = {
  phone1: string
  phoneDigitsState: ReturnType<typeof deriveFieldState>
  phoneVerificationCodeFieldState: ReturnType<typeof deriveFieldState>
  flowMessage: FlowMessage
  smsVerified: boolean
  smsCodeSent: boolean
  smsTimer: { mmss: string; isRunning: boolean }
  smsSendLabel: string
  canSendSms: boolean
  canVerifySms: boolean
  onSendSmsCode: () => void
  onVerifySmsCode: () => void
}

export type PasswordSectionProps = {
  passwordFieldState: 'default' | 'success' | 'error'
  passwordConfirmState: 'default' | 'success' | 'error'
  passwordConfirmMsg: string | null
}

export type SubmitSectionProps = {
  onSubmit: (event?: React.BaseSyntheticEvent) => Promise<void> | void
  label: string
  button: { disabled: boolean; variant: 'primary' | 'disabled' }
}

export type SignupSections = {
  nickname: NicknameSectionProps
  email: EmailSectionProps
  sms: SmsSectionProps
  password: PasswordSectionProps
  submit: SubmitSectionProps
}

export type BuildSignupSectionsParams = {
  nickname: NicknameSectionProps
  email: {
    fieldState: ReturnType<typeof deriveFieldState>
    codeFieldState: ReturnType<typeof deriveFieldState>
    flowMessage: FlowMessage
    verified: boolean
    codeSent: boolean
    timer: { mmss: string; isRunning: boolean }
    canSend: boolean
    canVerify: boolean
    onSendCode: () => void
    onVerifyCode: () => void
  }
  sms: {
    phone1: string
    sendStatus: Status
    codeFieldState: ReturnType<typeof deriveFieldState>
    flowMessage: FlowMessage
    verified: boolean
    codeSent: boolean
    timer: { mmss: string; isRunning: boolean }
    canSend: boolean
    canVerify: boolean
    onSendCode: () => void
    onVerifyCode: () => void
  }
  password: {
    passwordFieldState: 'default' | 'success' | 'error'
    passwordConfirmState: 'default' | 'success' | 'error'
    passwordConfirmMsg: string | null
  }
  submit: {
    onSubmit: (event?: React.BaseSyntheticEvent) => Promise<void> | void
    busy: boolean
    canSubmit: boolean
  }
}

export function buildSignupSections(
  params: BuildSignupSectionsParams
): SignupSections {
  const { nickname, email, sms, password, submit } = params

  return {
    nickname,
    email: {
      emailFieldState: email.fieldState,
      emailVerificationCodeFieldState: email.codeFieldState,
      flowMessage: email.flowMessage,
      emailVerified: email.verified,
      emailCodeSent: email.codeSent,
      emailTimer: email.timer,
      emailSendLabel: email.codeSent
        ? AUTH_MESSAGES.buttons.resend
        : AUTH_MESSAGES.buttons.emailSend,
      canSendEmail: email.canSend,
      canVerifyEmail: email.canVerify,
      onSendEmailCode: email.onSendCode,
      onVerifyEmailCode: email.onVerifyCode,
    },
    sms: {
      phone1: sms.phone1,
      phoneDigitsState: deriveFieldState({
        hasError: sms.sendStatus === 'error',
        isVerified: sms.verified,
        isSuccess: sms.sendStatus === 'success',
      }),
      phoneVerificationCodeFieldState: sms.codeFieldState,
      flowMessage: sms.flowMessage,
      smsVerified: sms.verified,
      smsCodeSent: sms.codeSent,
      smsTimer: sms.timer,
      smsSendLabel: sms.codeSent
        ? AUTH_MESSAGES.buttons.resend
        : AUTH_MESSAGES.buttons.smsSend,
      canSendSms: sms.canSend,
      canVerifySms: sms.canVerify,
      onSendSmsCode: sms.onSendCode,
      onVerifySmsCode: sms.onVerifyCode,
    },
    password,
    submit: {
      onSubmit: submit.onSubmit,
      label: submit.busy
        ? AUTH_MESSAGES.common.submitBusy
        : AUTH_MESSAGES.common.submitLabel,
      button: {
        disabled: !submit.canSubmit,
        variant: (submit.canSubmit ? 'primary' : 'disabled') as
          | 'primary'
          | 'disabled',
      },
    },
  }
}
