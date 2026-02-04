// 회원가입 폼 통합 - RHF + 이메일/SMS 인증 + 닉네임체크 + 비밀번호 + 제출
import { useCallback, useMemo, useState } from 'react'
import { useForm, useWatch, type Path } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'

import {
  signupSchema,
  type SignupFormData,
} from '@/schemas/auth'
import { useAuthStore } from '@/store/authStore'
import {
  validateAndFormatSignupData,
  executeSignupAndLogin,
} from '@/hooks/signup/signupSubmitHelpers'
import { normalizePhone, normalizeEmail } from '@/utils/normalize'
import { AUTH_MESSAGES } from '@/constants/authMessages'
import { useEmailVerification } from '@/hooks/signup/useEmailVerification'
import { useSmsVerification } from '@/hooks/signup/useSmsVerification'
import { useNicknameCheck } from '@/hooks/signup/useNicknameCheck'
import { useSignupPasswordState } from '@/hooks/signup/useSignupPasswordState'
import { buildSignupSections } from '@/hooks/signup/buildSignupSections'
import {
  deriveFieldState,
} from '@/utils/formMessage'
import { useRootErrorBridge } from '@/hooks/vm/useVerificationFieldHelpers'

type BusyAction = 'nickname' | 'email' | 'sms' | 'submit' | null

function createBusyActionSetter(
  setBusyAction: React.Dispatch<React.SetStateAction<BusyAction>>,
  action: Exclude<BusyAction, null>
) {
  return (isBusy: boolean) => {
    setBusyAction((current) =>
      isBusy ? action : current === action ? null : current
    )
  }
}

function validateSignupPrerequisites(
  nicknameChecked: boolean,
  emailVerified: boolean,
  emailToken: string | null,
  smsVerified: boolean,
  smsToken: string | null
): string | null {
  if (!nicknameChecked) return AUTH_MESSAGES.form.requireNicknameCheck
  if (!emailVerified || !emailToken) return AUTH_MESSAGES.form.requireEmailVerify
  if (!smsVerified || !smsToken) return AUTH_MESSAGES.form.requireSmsVerify
  return null
}

const SIGNUP_DEFAULT_VALUES: SignupFormData = {
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
}

export function useSignupForm() {
  const navigate = useNavigate()
  const authLogin = useAuthStore((state) => state.login)

  const methods = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: SIGNUP_DEFAULT_VALUES,
    mode: 'onBlur',
    reValidateMode: 'onBlur',
    shouldFocusError: true,
  })

  const {
    handleSubmit,
    control,
    setError,
    clearErrors,
    trigger,
    formState,
  } = methods

  const setRootError = useRootErrorBridge(methods)

  const watchedValues = useWatch({ control }) as Partial<SignupFormData>
  const nickname = (watchedValues.nickname ?? '').toString().trim()
  const email = (watchedValues.email ?? '').toString().trim()
  const emailVerificationCode = (watchedValues.emailVerificationCode ?? '')
    .toString()
    .trim()
  const phone1 = (watchedValues.phone1 ?? '').toString().trim()
  const phone2 = (watchedValues.phone2 ?? '').toString().trim()
  const phone3 = (watchedValues.phone3 ?? '').toString().trim()
  const phoneVerificationCode = (watchedValues.phoneVerificationCode ?? '')
    .toString()
    .trim()
  const password = (watchedValues.password ?? '').toString()
  const passwordConfirm = (watchedValues.passwordConfirm ?? '').toString()

  const [busyAction, setBusyAction] = useState<BusyAction>(null)
  const busy = busyAction !== null

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
    setBusy: createBusyActionSetter(setBusyAction, 'email'),
    clearErrors: clearFieldErrors,
    setFieldError,
  })

  const smsFlow = useSmsVerification({
    phoneNumber,
    phone2,
    phone3,
    phoneVerificationCode,
    busy,
    setBusy: createBusyActionSetter(setBusyAction, 'sms'),
    clearErrors: clearFieldErrors,
    setFieldError,
  })

  const nicknameCheck = useNicknameCheck({
    nickname,
    busy,
    trigger,
    clearErrors,
    setError,
    setRootError,
    setBusy: createBusyActionSetter(setBusyAction, 'nickname'),
  })

  const passwordState = useSignupPasswordState({
    password,
    passwordConfirm,
    passwordTouched: !!formState.touchedFields.password,
    trigger,
  })

  const validatePrerequisites = useCallback(
    () =>
      validateSignupPrerequisites(
        nicknameCheck.nicknameChecked,
        emailFlow.verified,
        emailFlow.token,
        smsFlow.verified,
        smsFlow.token
      ),
    [
      nicknameCheck.nicknameChecked,
      emailFlow.verified,
      emailFlow.token,
      smsFlow.verified,
      smsFlow.token,
    ]
  )

  const handleSubmitSignup = useCallback(
    (event?: React.BaseSyntheticEvent) => {
      return handleSubmit(async (data) => {
        setRootError(null)

        const validationResult = validateAndFormatSignupData(
          data,
          validatePrerequisites
        )
        if (!validationResult.success) {
          if (validationResult.errorMessage === AUTH_MESSAGES.form.birthdateFormat) {
            setError('birthdate', { message: validationResult.errorMessage })
          } else {
            setRootError(validationResult.errorMessage)
          }
          return
        }

        setBusyAction('submit')
        const signupResult = await executeSignupAndLogin({
          data,
          formattedBirthday: validationResult.formattedBirthday,
          emailToken: emailFlow.token!,
          smsToken: smsFlow.token!,
          authLogin,
        })
        setBusyAction((current) =>
          current === 'submit' ? null : current
        )

        if (!signupResult.success) {
          setRootError(signupResult.errorMessage)
          return
        }
        navigate('/', { replace: true })
      })(event)
    },
    [
      handleSubmit,
      validatePrerequisites,
      setRootError,
      setError,
      setBusyAction,
      emailFlow.token,
      smsFlow.token,
      authLogin,
      navigate,
    ]
  )

  const nicknameFieldState = useMemo(
    () =>
      deriveFieldState({
        hasError: !!formState.errors.nickname?.message,
        isVerified: nicknameCheck.nicknameChecked,
        isSuccess: nicknameCheck.nicknameStatus === 'success',
      }),
    [
      formState.errors.nickname?.message,
      nicknameCheck.nicknameChecked,
      nicknameCheck.nicknameStatus,
    ]
  )

  const canSubmit = useMemo(
    () =>
      formState.isValid &&
      nicknameCheck.nicknameChecked &&
      !!emailFlow.verified &&
      !!emailFlow.token &&
      !!smsFlow.verified &&
      !!smsFlow.token &&
      passwordState.passwordFieldState === 'success' &&
      passwordState.passwordConfirmState === 'success' &&
      !busy,
    [
      formState.isValid,
      nicknameCheck.nicknameChecked,
      emailFlow.verified,
      emailFlow.token,
      smsFlow.verified,
      smsFlow.token,
      passwordState.passwordFieldState,
      passwordState.passwordConfirmState,
      busy,
    ]
  )

  const sections = useMemo(
    () =>
      buildSignupSections({
        nickname: {
          nicknameFieldState,
          flowMessage: nicknameCheck.nicknameFlowMessage,
          nicknameChecked: nicknameCheck.nicknameChecked,
          nickname,
          canCheckNickname: nicknameCheck.canCheckNickname,
          busy,
          onCheckNickname: nicknameCheck.onCheckNickname,
        },
        email: {
          fieldState: emailFlow.ui.fieldState,
          codeFieldState: emailFlow.ui.codeFieldState,
          flowMessage: emailFlow.flowMessage,
          verified: emailFlow.verified,
          codeSent: emailFlow.codeSent,
          timer: emailFlow.timer,
          canSend: emailFlow.ui.canSend,
          canVerify: emailFlow.ui.canVerify,
          onSendCode: emailFlow.actions.onSendCode,
          onVerifyCode: emailFlow.actions.onVerifyCode,
        },
        sms: {
          phone1,
          sendStatus: smsFlow.sendStatus,
          codeFieldState: smsFlow.ui.codeFieldState,
          flowMessage: smsFlow.flowMessage,
          verified: smsFlow.verified,
          codeSent: smsFlow.codeSent,
          timer: smsFlow.timer,
          canSend: smsFlow.ui.canSend,
          canVerify: smsFlow.ui.canVerify,
          onSendCode: smsFlow.actions.onSendCode,
          onVerifyCode: smsFlow.actions.onVerifyCode,
        },
        password: {
          passwordFieldState: passwordState.passwordFieldState,
          passwordConfirmState: passwordState.passwordConfirmState,
          passwordConfirmMsg: passwordState.passwordConfirmMessage,
        },
        submit: {
          onSubmit: handleSubmitSignup,
          busy,
          canSubmit,
        },
      }),
    [
      nicknameFieldState,
      nicknameCheck,
      nickname,
      busy,
      emailFlow,
      smsFlow,
      phone1,
      passwordState,
      handleSubmitSignup,
      canSubmit,
    ]
  )

  return {
    methods,
    sections,
  }
}
