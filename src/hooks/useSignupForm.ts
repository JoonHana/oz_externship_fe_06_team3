// 회원가입 폼 전체를 관리하는 커스텀 훅.
// RHF 세팅 + 닉네임 체크 + 이메일 인증 Flow + SMS 인증 Flow + 최종 signup/auto-login + UI 섹션별 props(sections) 생성까지 한 번에 제공
import { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import { useForm, useWatch, type Path } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'

import {
  signupSchema,
  NICKNAME_REGEX,
  type SignupFormData,
} from '@/schemas/auth'
import * as authApi from '@/api/auth'
import { useAuthStore } from '@/store/authStore'
import {
  formatBirthday,
  mapGender,
  derivePasswordFieldState,
  derivePasswordConfirmState,
  derivePasswordConfirmMessage,
} from '@/utils/signupUtils'
import {
  mapCheckNicknameError,
  mapSignupError,
} from '@/utils/error/authEndpointErrorMapper'
import { normalizePhone, normalizeEmail } from '@/utils/normalize'
import { AUTH_MESSAGES } from '@/constants/authMessages'
import { useEmailVerification } from '@/hooks/signup/useEmailVerification'
import { useSmsVerification } from '@/hooks/signup/useSmsVerification'
import type { Status } from '@/hooks/useVerificationFlow'
import {
  type FlowMessage,
  IDLE_FLOW_MESSAGE,
  deriveFieldState,
} from '@/utils/formMessage'
import { useRootErrorBridge } from '@/hooks/vm/useVerificationFieldHelpers'

type BusyAction = 'nickname' | 'email' | 'sms' | 'submit' | null

// NicknameSection (닉네임 입력 + 중복확인)
type NicknameSectionProps = {
  nicknameFieldState: ReturnType<typeof deriveFieldState>
  flowMessage: FlowMessage
  nicknameChecked: boolean
  nickname: string
  canCheckNickname: boolean
  busy: boolean
  onCheckNickname: () => void
}

// EmailSection (이메일 입력 + 코드 전송/검증)
type EmailSectionProps = {
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

// PhoneSection (전화번호 입력 + 코드 전송/검증)
type SmsSectionProps = {
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

// PasswordSection (비밀번호/확인)
type PasswordSectionProps = {
  passwordFieldState: 'default' | 'success' | 'error'
  passwordConfirmState: 'default' | 'success' | 'error'
  passwordConfirmMsg: string | null
}

// Submit 영역 (가입 버튼)
type SubmitSectionProps = {
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void> | void
  label: string
  button: { disabled: boolean; variant: 'primary' | 'disabled' }
}

type SignupSections = {
  nickname: NicknameSectionProps
  email: EmailSectionProps
  sms: SmsSectionProps
  password: PasswordSectionProps
  submit: SubmitSectionProps
}

export function useSignupForm() {
  const navigate = useNavigate()
  const authLogin = useAuthStore((s) => s.login)

  const methods = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: '',
      nickname: '',
      birthdate: '',
      gender: 'male',
      email: '',
      emailVerificationCode: '',
      phone1: '010',
      phone2: '',
      phone3: '',
      phoneVerificationCode: '',
      password: '',
      passwordConfirm: '',
    },
    mode: 'onBlur',
    reValidateMode: 'onBlur',
    shouldFocusError: true,
  })

  const { handleSubmit, control, setError, clearErrors, trigger, formState } =
    methods
  // 전역 에러를 errors.root로 통일하기 위한 브리지
  const setRootError = useRootErrorBridge(methods)

  const watched = useWatch({ control }) as Partial<SignupFormData>
  const nickname = (watched.nickname ?? '').toString().trim()
  const email = (watched.email ?? '').toString().trim()
  const emailVerificationCode = (watched.emailVerificationCode ?? '')
    .toString()
    .trim()
  const phone1 = (watched.phone1 ?? '').toString().trim()
  const phone2 = (watched.phone2 ?? '').toString().trim()
  const phone3 = (watched.phone3 ?? '').toString().trim()
  const phoneVerificationCode = (watched.phoneVerificationCode ?? '')
    .toString()
    .trim()
  const password = (watched.password ?? '').toString()
  const passwordConfirm = (watched.passwordConfirm ?? '').toString()

  const [busyAction, setBusyAction] = useState<BusyAction>(null)
  const busy = busyAction !== null
  const makeSetBusy =
    (action: Exclude<BusyAction, null>) => (isBusy: boolean) => {
      setBusyAction((curr) => (isBusy ? action : curr === action ? null : curr))
    }
  const [nicknameChecked, setNicknameChecked] = useState(false)
  const [nicknameStatus, setNicknameStatus] = useState<Status>('idle')
  const [nicknameFlowMessage, setNicknameFlowMessage] =
    useState<FlowMessage>(IDLE_FLOW_MESSAGE)

  const phoneNumber = useMemo(
    () => normalizePhone(`${phone1}${phone2}${phone3}`),
    [phone1, phone2, phone3]
  )

  const clearFieldErrors = useCallback(
    (names: Path<SignupFormData> | Path<SignupFormData>[]) =>
      clearErrors(names),
    [clearErrors]
  )
  const setFieldError = useCallback(
    (name: Path<SignupFormData>, message: string) =>
      setError(name, { message }),
    [setError]
  )

  const emailFlow = useEmailVerification({
    email: normalizeEmail(email),
    emailVerificationCode,
    busy,
    setBusy: makeSetBusy('email'),
    clearErrors: clearFieldErrors,
    setFieldError,
  })

  const smsFlow = useSmsVerification({
    phoneNumber,
    phone2,
    phone3,
    phoneVerificationCode,
    busy,
    setBusy: makeSetBusy('sms'),
    clearErrors: clearFieldErrors,
    setFieldError,
  })

  useEffect(() => {
    setNicknameChecked(false)
    setNicknameStatus('idle')
    setNicknameFlowMessage(IDLE_FLOW_MESSAGE)
  }, [nickname])

  const onCheckNickname = useCallback(async () => {
    setRootError(null)
    const ok = await trigger('nickname')
    if (!ok) return
    clearErrors('nickname')
    setBusyAction('nickname')
    try {
      await authApi.checkNickname({ nickname })
      setNicknameChecked(true)
      setNicknameStatus('success')
      setNicknameFlowMessage({
        type: 'success',
        message: AUTH_MESSAGES.nickname.available,
        scope: null,
      })
    } catch (err) {
      setNicknameChecked(false)
      setNicknameFlowMessage(IDLE_FLOW_MESSAGE)
      const mapped = mapCheckNicknameError(err)
      setNicknameStatus('error')
      setError('nickname', { message: mapped.message })
    } finally {
      setBusyAction((curr) => (curr === 'nickname' ? null : curr))
    }
  }, [nickname, trigger, clearErrors, setError, setRootError])

  const onSubmit = useCallback(
    (e?: import('react').BaseSyntheticEvent) => {
      return handleSubmit(async (data) => {
        setRootError(null)
        if (!nicknameChecked) {
          setRootError(AUTH_MESSAGES.form.requireNicknameCheck)
          return
        }
        if (!emailFlow.verified || !emailFlow.token) {
          setRootError(AUTH_MESSAGES.form.requireEmailVerify)
          return
        }
        if (!smsFlow.verified || !smsFlow.token) {
          setRootError(AUTH_MESSAGES.form.requireSmsVerify)
          return
        }

        const birthday = formatBirthday(data.birthdate)
        if (!birthday) {
          setError('birthdate', {
            message: AUTH_MESSAGES.common.birthdateFormat,
          })
          return
        }

        setBusyAction('submit')
        try {
          await authApi.signup({
            password: data.password,
            passwordConfirm: data.passwordConfirm,
            nickname: data.nickname.trim(),
            name: data.name.trim(),
            birthday,
            gender: mapGender(data.gender),
            emailToken: emailFlow.token!,
            smsToken: smsFlow.token!,
          })
          await authLogin({
            email: normalizeEmail(data.email),
            password: data.password,
          })
          navigate('/', { replace: true })
        } catch (err) {
          const mapped = mapSignupError(err)
          setRootError(mapped.message)
        } finally {
          setBusyAction((curr) => (curr === 'submit' ? null : curr))
        }
      })(e)
    },
    [
      handleSubmit,
      nicknameChecked,
      emailFlow.verified,
      emailFlow.token,
      smsFlow.verified,
      smsFlow.token,
      setRootError,
      setError,
      authLogin,
      navigate,
    ]
  )

  const nicknameFieldState = useMemo(
    () =>
      deriveFieldState({
        hasError: !!formState.errors.nickname?.message,
        isVerified: nicknameChecked,
        isSuccess: nicknameStatus === 'success',
      }),
    [formState.errors.nickname?.message, nicknameChecked, nicknameStatus]
  )

  const canCheckNickname =
    !busy && !nicknameChecked && NICKNAME_REGEX.test(nickname)

  const passwordTouched = !!formState.touchedFields.password
  const passwordConfirmTouched = !!formState.touchedFields.passwordConfirm

  const passwordFieldState = useMemo(
    () =>
      passwordTouched
        ? derivePasswordFieldState(password)
        : ('default' as const),
    [passwordTouched, password]
  )
  const passwordConfirmState = useMemo(
    () =>
      passwordConfirmTouched
        ? derivePasswordConfirmState(password, passwordConfirm)
        : ('default' as const),
    [passwordConfirmTouched, password, passwordConfirm]
  )
  const passwordConfirmMsg = useMemo(
    () =>
      passwordConfirmTouched
        ? derivePasswordConfirmMessage(password, passwordConfirm)
        : null,
    [passwordConfirmTouched, password, passwordConfirm]
  )

  const triggerRef = useRef(trigger)
  triggerRef.current = trigger
  useEffect(() => {
    if (passwordConfirm.trim()) void triggerRef.current('passwordConfirm')
  }, [password, passwordConfirm])

  const canSubmit = useMemo(
    () =>
      formState.isValid &&
      nicknameChecked &&
      !!emailFlow.verified &&
      !!emailFlow.token &&
      !!smsFlow.verified &&
      !!smsFlow.token &&
      passwordFieldState === 'success' &&
      passwordConfirmState === 'success' &&
      !busy,
    [
      formState.isValid,
      nicknameChecked,
      emailFlow.verified,
      emailFlow.token,
      smsFlow.verified,
      smsFlow.token,
      passwordFieldState,
      passwordConfirmState,
      busy,
    ]
  )

  const sections: SignupSections = {
    nickname: {
      nicknameFieldState,
      flowMessage: nicknameFlowMessage,
      nicknameChecked,
      nickname,
      canCheckNickname,
      busy,
      onCheckNickname,
    },
    email: {
      emailFieldState: emailFlow.ui.fieldState,
      emailVerificationCodeFieldState: emailFlow.ui.codeFieldState,
      flowMessage: emailFlow.flowMessage,
      emailVerified: emailFlow.verified,
      emailCodeSent: emailFlow.codeSent,
      emailTimer: emailFlow.timer,
      emailSendLabel: emailFlow.codeSent
        ? AUTH_MESSAGES.buttons.resend
        : AUTH_MESSAGES.buttons.emailSend,
      canSendEmail: emailFlow.ui.canSend,
      canVerifyEmail: emailFlow.ui.canVerify,
      onSendEmailCode: emailFlow.actions.onSendCode,
      onVerifyEmailCode: emailFlow.actions.onVerifyCode,
    },
    sms: {
      phone1,
      phoneDigitsState: deriveFieldState({
        hasError: smsFlow.sendStatus === 'error',
        isVerified: smsFlow.verified,
        isSuccess: smsFlow.sendStatus === 'success',
      }),
      phoneVerificationCodeFieldState: smsFlow.ui.codeFieldState,
      flowMessage: smsFlow.flowMessage,
      smsVerified: smsFlow.verified,
      smsCodeSent: smsFlow.codeSent,
      smsTimer: smsFlow.timer,
      smsSendLabel: smsFlow.codeSent
        ? AUTH_MESSAGES.buttons.resend
        : AUTH_MESSAGES.buttons.smsSend,
      canSendSms: smsFlow.ui.canSend,
      canVerifySms: smsFlow.ui.canVerify,
      onSendSmsCode: smsFlow.actions.onSendCode,
      onVerifySmsCode: smsFlow.actions.onVerifyCode,
    },
    password: {
      passwordFieldState,
      passwordConfirmState,
      passwordConfirmMsg,
    },
    submit: {
      onSubmit,
      label: busy
        ? AUTH_MESSAGES.common.submitBusy
        : AUTH_MESSAGES.common.submitLabel,
      button: {
        disabled: !canSubmit,
        variant: (canSubmit ? 'primary' : 'disabled') as 'primary' | 'disabled',
      },
    },
  }

  return {
    methods,
    sections,
  }
}
