// 일반회원 이메일 회원가입 폼 - 닉네임/이메일/휴대전화/비밀번호 등
import { useCallback, useMemo, useState, type Dispatch, type SetStateAction } from 'react'
import {
  FormProvider,
  useForm,
  useWatch,
  type Control,
  type Path,
} from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'

import { Button } from '@/components/common/Button'
import { CommonInputField } from '@/components/common/CommonInputField'
import { FormErrorDisplay } from '@/components/common/FormErrorDisplay'
import MockAuthHelpPanel from '@/components/auth/MockAuthHelpPanel'

import { NicknameSection } from '@/components/signup/NicknameSection'
import { EmailSection } from '@/components/signup/EmailSection'
import { PhoneSection } from '@/components/signup/PhoneSection'
import { PasswordSection } from '@/components/signup/PasswordSection'
import { GenderField } from '@/components/signup/GenderField'
import { SectionBlock } from '@/components/signup/SectionBlock'

import { signupSchema, type SignupFormData } from '@/schemas/auth'
import { useAuthStore } from '@/store/authStore'
import { normalizePhone, normalizeEmail } from '@/utils/normalize'
import { AUTH_MESSAGES } from '@/constants/authMessages'
import { useEmailVerification } from '@/hooks/signup/useEmailVerification'
import { useSmsVerification } from '@/hooks/signup/useSmsVerification'
import { useNicknameCheck } from '@/hooks/signup/useNicknameCheck'
import { useSignupPasswordState } from '@/hooks/signup/useSignupPasswordState'
import {
  validateAndFormatSignupData,
  executeSignupAndLogin,
} from '@/hooks/signup/signupSubmitHelpers'
import { deriveFieldState } from '@/utils/formMessage'
import { useRootErrorBridge } from '@/hooks/form/useRootErrorBridge'

type BusyAction = 'nickname' | 'email' | 'sms' | 'submit' | null

type SignupWatchedValues = {
  nickname: string
  email: string
  emailVerificationCode: string
  phone1: string
  phone2: string
  phone3: string
  phoneVerificationCode: string
  password: string
  passwordConfirm: string
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

export default function SignupEmailPage() {
  const navigate = useNavigate()
  const authLogin = useAuthStore((state) => state.login)

  // 폼 설정
  const methods = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: SIGNUP_DEFAULT_VALUES,
    mode: 'onBlur',
    reValidateMode: 'onBlur',
    shouldFocusError: true,
  })

  const { control, setError, clearErrors, trigger, formState, handleSubmit } =
    methods

  const setRootError = useRootErrorBridge(methods)
  const rootError = formState.errors.root?.message ?? null

  // 입력값 관찰 및 파생값 계산
  const values = useSignupWatchedValues(control)
  const phoneNumber = useMemo(
    () => normalizePhone(`${values.phone1}${values.phone2}${values.phone3}`),
    [values.phone1, values.phone2, values.phone3]
  )

  // 비동기 흐름 상태
  const [busyAction, setBusyAction] = useState<BusyAction>(null)
  const isBusy = busyAction !== null

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

  // 필드별 플로우
  const emailFlow = useEmailVerification({
    email: normalizeEmail(values.email),
    emailVerificationCode: values.emailVerificationCode,
    busy: isBusy,
    setBusy: createBusyActionSetter(setBusyAction, 'email'),
    clearErrors: clearFieldErrors,
    setFieldError,
  })

  const smsFlow = useSmsVerification({
    phoneNumber,
    phone2: values.phone2,
    phone3: values.phone3,
    phoneVerificationCode: values.phoneVerificationCode,
    busy: isBusy,
    setBusy: createBusyActionSetter(setBusyAction, 'sms'),
    clearErrors: clearFieldErrors,
    setFieldError,
  })

  const nicknameCheck = useNicknameCheck({
    nickname: values.nickname,
    busy: isBusy,
    trigger,
    clearErrors,
    setError,
    setRootError,
    setBusy: createBusyActionSetter(setBusyAction, 'nickname'),
  })

  // 비밀번호 상태
  const passwordState = useSignupPasswordState({
    password: values.password,
    passwordConfirm: values.passwordConfirm,
    passwordTouched: !!formState.touchedFields.password,
    trigger,
  })

  // UI 상태
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

  // 제출 가능 여부
  const canSubmit = useMemo(
    () =>
      canSubmitSignupForm({
        isFormValid: formState.isValid,
        nicknameChecked: nicknameCheck.nicknameChecked,
        email: { verified: emailFlow.verified, token: emailFlow.token },
        sms: { verified: smsFlow.verified, token: smsFlow.token },
        passwordState,
        isBusy,
      }),
    [
      formState.isValid,
      nicknameCheck.nicknameChecked,
      emailFlow.verified,
      emailFlow.token,
      smsFlow.verified,
      smsFlow.token,
      passwordState,
      isBusy,
    ]
  )

  // 버튼 라벨
  const submitLabel = isBusy
    ? AUTH_MESSAGES.common.submitBusy
    : AUTH_MESSAGES.common.submitLabel
  const submitVariant = canSubmit ? 'primary' : 'disabled'

  const emailSendLabel = emailFlow.codeSent
    ? AUTH_MESSAGES.buttons.resend
    : AUTH_MESSAGES.buttons.emailSend
  const smsSendLabel = smsFlow.codeSent
    ? AUTH_MESSAGES.buttons.resend
    : AUTH_MESSAGES.buttons.smsSend

  const getPrerequisiteError = () =>
    getSignupPrerequisiteError({
      nicknameChecked: nicknameCheck.nicknameChecked,
      emailVerified: emailFlow.verified,
      emailToken: emailFlow.token,
      smsVerified: smsFlow.verified,
      smsToken: smsFlow.token,
    })

  // 제출 플로우
  const handleSignupSubmit = handleSubmit(async (formData) => {
    setRootError(null)

    // 1단계: 데이터 검증 및 포맷팅
    const validationResult = validateAndFormatSignupData(
      formData,
      getPrerequisiteError
    )

    if (!validationResult.success) {
      if (validationResult.errorMessage === AUTH_MESSAGES.form.birthdateFormat) {
        setError('birthdate', {
          message: validationResult.errorMessage,
        })
      } else {
        setRootError(validationResult.errorMessage)
      }
      return
    }

    // 2단계: API 호출
    setBusyAction('submit')
    try {
      const signupResult = await executeSignupAndLogin({
        data: formData,
        formattedBirthday: validationResult.formattedBirthday,
        emailToken: emailFlow.token!,
        smsToken: smsFlow.token!,
        authLogin,
      })

      if (!signupResult.success) {
        setRootError(signupResult.errorMessage)
        return
      }

      navigate('/', { replace: true })
    } catch {
      setRootError('회원가입 중 오류가 발생했습니다.')
    } finally {
      setBusyAction(null)
    }
  })

  return (
    <FormProvider {...methods}>
      <>
        <div className="flex min-h-[calc(100vh-96px)] items-center justify-center bg-gray-100 pt-[min(8vh)] pb-[min(10vh)]">
          <div className="bg-white px-6 py-10">
            <div className="flex w-[480px] flex-col gap-9">
              <div className="flex flex-col items-center gap-4">
                <p className="text-foreground text-center text-[18px] font-bold">
                  마법같이 빠르게 성장시켜줄
                </p>
                <img
                  className="h-6 w-[180px] object-contain"
                  alt="OZ. 오즈코딩스쿨"
                  src="/LoginPage_img/ozcoding_logo.png"
                />
              </div>

              <h1 className="text-foreground text-left text-[18px] font-semibold">
                회원가입
              </h1>

              <form
                onSubmit={handleSignupSubmit}
                className="flex flex-col gap-11"
              >
                <SectionBlock label="이름">
                  <CommonInputField<SignupFormData>
                    name="name"
                    type="text"
                    placeholder="이름을 입력해주세요"
                    width="100%"
                    placeholderVariant="a"
                    helperVisibility="always"
                  />
                </SectionBlock>

                <NicknameSection
                  nicknameFieldState={nicknameFieldState}
                  flowMessage={nicknameCheck.nicknameFlowMessage}
                  nicknameChecked={nicknameCheck.nicknameChecked}
                  nickname={values.nickname}
                  canCheckNickname={nicknameCheck.canCheckNickname}
                  busy={isBusy}
                  onCheckNickname={nicknameCheck.onCheckNickname}
                />

                <SectionBlock label="생년월일">
                  <CommonInputField<SignupFormData>
                    name="birthdate"
                    type="text"
                    placeholder="8자리 입력해주세요 (ex.20000101)"
                    width="100%"
                    placeholderVariant="a"
                    helperVisibility="always"
                  />
                </SectionBlock>

                <SectionBlock label="성별">
                  <GenderField />
                </SectionBlock>

                <EmailSection
                  emailFieldState={emailFlow.ui.fieldState}
                  emailVerificationCodeFieldState={emailFlow.ui.codeFieldState}
                  flowMessage={emailFlow.flowMessage}
                  emailVerified={emailFlow.verified}
                  emailCodeSent={emailFlow.codeSent}
                  emailTimer={emailFlow.timer}
                  emailSendLabel={emailSendLabel}
                  canSendEmail={emailFlow.ui.canSend}
                  canVerifyEmail={emailFlow.ui.canVerify}
                  onSendEmailCode={emailFlow.actions.onSendCode}
                  onVerifyEmailCode={emailFlow.actions.onVerifyCode}
                />
                <PhoneSection
                  phone1={values.phone1}
                  phoneDigitsState={smsFlow.ui.fieldState}
                  phoneVerificationCodeFieldState={smsFlow.ui.codeFieldState}
                  flowMessage={smsFlow.flowMessage}
                  smsVerified={smsFlow.verified}
                  smsCodeSent={smsFlow.codeSent}
                  smsTimer={smsFlow.timer}
                  smsSendLabel={smsSendLabel}
                  canSendSms={smsFlow.ui.canSend}
                  canVerifySms={smsFlow.ui.canVerify}
                  onSendSmsCode={smsFlow.actions.onSendCode}
                  onVerifySmsCode={smsFlow.actions.onVerifyCode}
                />
                <PasswordSection
                  passwordFieldState={passwordState.passwordFieldState}
                  passwordConfirmState={passwordState.passwordConfirmState}
                  passwordConfirmMsg={passwordState.passwordConfirmMessage}
                />

                <div className="flex flex-col gap-2">
                  <FormErrorDisplay message={rootError} />
                  <Button
                    type="submit"
                    size="xxl"
                    variant={submitVariant}
                    disabled={!canSubmit}
                    className="whitespace-nowrap"
                  >
                    {submitLabel}
                  </Button>
                </div>
              </form>

              <p className="mt-6 text-center">
                <Link
                  to="/signup"
                  className="text-mono-600 text-[16px] leading-[22.4px] tracking-[-0.48px] underline hover:no-underline"
                >
                  소셜/일반 선택으로 돌아가기
                </Link>
              </p>
            </div>
          </div>
        </div>
        <MockAuthHelpPanel variant="signup" />
      </>
    </FormProvider>
  )
}

function createBusyActionSetter(
  setBusyAction: Dispatch<SetStateAction<BusyAction>>,
  action: Exclude<BusyAction, null>
) {
  return (isBusy: boolean) => {
    setBusyAction((current) =>
      isBusy ? action : current === action ? null : current
    )
  }
}

function getSignupPrerequisiteError(params: {
  nicknameChecked: boolean
  emailVerified: boolean
  emailToken: string | null
  smsVerified: boolean
  smsToken: string | null
}): string | null {
  const { nicknameChecked, emailVerified, emailToken, smsVerified, smsToken } =
    params

  if (!nicknameChecked) return AUTH_MESSAGES.form.requireNicknameCheck
  if (!emailVerified || !emailToken)
    return AUTH_MESSAGES.form.requireEmailVerify
  if (!smsVerified || !smsToken) return AUTH_MESSAGES.form.requireSmsVerify
  return null
}

function canSubmitSignupForm(params: {
  isFormValid: boolean
  nicknameChecked: boolean
  email: { verified: boolean; token: string | null }
  sms: { verified: boolean; token: string | null }
  passwordState: {
    passwordFieldState: 'default' | 'success' | 'error'
    passwordConfirmState: 'default' | 'success' | 'error'
  }
  isBusy: boolean
}): boolean {
  const { isFormValid, nicknameChecked, email, sms, passwordState, isBusy } =
    params

  const hasAllTokens =
    email.verified && !!email.token && sms.verified && !!sms.token
  const isPasswordValid =
    passwordState.passwordFieldState === 'success' &&
    passwordState.passwordConfirmState === 'success'

  return (
    isFormValid &&
    nicknameChecked &&
    hasAllTokens &&
    isPasswordValid &&
    !isBusy
  )
}

function useSignupWatchedValues(
  control: Control<SignupFormData>
): SignupWatchedValues {
  const watchedValues = useWatch({ control }) as Partial<SignupFormData>

  return {
    nickname: (watchedValues.nickname ?? '').toString().trim(),
    email: (watchedValues.email ?? '').toString().trim(),
    emailVerificationCode: (watchedValues.emailVerificationCode ?? '')
      .toString()
      .trim(),
    phone1: (watchedValues.phone1 ?? '').toString().trim(),
    phone2: (watchedValues.phone2 ?? '').toString().trim(),
    phone3: (watchedValues.phone3 ?? '').toString().trim(),
    phoneVerificationCode: (watchedValues.phoneVerificationCode ?? '')
      .toString()
      .trim(),
    password: (watchedValues.password ?? '').toString(),
    passwordConfirm: (watchedValues.passwordConfirm ?? '').toString(),
  }
}
