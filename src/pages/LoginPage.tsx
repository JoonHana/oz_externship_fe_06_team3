/**
 * 로그인 페이지
 * - 일반 로그인 폼
 * - 아이디/비밀번호 찾기 모달
 * - 에러는 errors.root로 표시
 */
import { useState, useEffect, useMemo, useRef } from 'react'
import { FormProvider, useForm, useWatch } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'

import { CommonInputField } from '@/components/common/CommonInputField'
import { PasswordField } from '@/components/common/PasswordField'
import { Button } from '@/components/common/Button'
import { FormErrorDisplay } from '@/components/common/FormErrorDisplay'
import SocialLoginSection from '@/components/auth/SocialLoginSection'
import {
  FindIdResultModal,
  ResetPasswordModal,
} from '@/components/common/Modal'
import {
  FindIdModal,
  FindPasswordModal,
} from '@/components/common/Modal/variants'
import type { SocialProviderId } from '@/types/social'
import type { FindPasswordVerifiedPayload } from '@/hooks/flow'

import { useAuthStore } from '@/store/authStore'
import { loginSchema, type LoginFormData } from '@/schemas/auth'
import { AUTH_MESSAGES } from '@/constants/authMessages'
import { mapLoginError } from '@/utils/error/authEndpointErrorMapper'
import { createSocialRedirect } from '@/api/socialAuth'

/** 아이디/비밀번호 찾기 모달 상태 및 액션 */
function useAccountRecoveryModals() {
  const [isFindIdOpen, setIsFindIdOpen] = useState(false)
  const [isFindIdResultOpen, setIsFindIdResultOpen] = useState(false)
  const [maskedEmail, setMaskedEmail] = useState('')
  const [isFindPasswordOpen, setIsFindPasswordOpen] = useState(false)
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false)
  const [emailToken, setEmailToken] = useState<string | null>(null)

  const closeFindId = () => setIsFindIdOpen(false)
  const closeFindIdResult = () => setIsFindIdResultOpen(false)
  const closeFindPassword = () => setIsFindPasswordOpen(false)
  const closeResetPassword = () => {
    setIsResetPasswordOpen(false)
    setEmailToken(null)
  }

  const openFindId = () => setIsFindIdOpen(true)
  const openFindPassword = () => setIsFindPasswordOpen(true)

  const handleFindIdSuccess = (maskedEmailResult: string) => {
    setIsFindIdOpen(false)
    setMaskedEmail(maskedEmailResult)
    setIsFindIdResultOpen(true)
  }

  const goToFindPasswordFromResult = () => {
    setIsFindIdResultOpen(false)
    setIsFindPasswordOpen(true)
  }

  const openResetPasswordWithToken = (payload: FindPasswordVerifiedPayload) => {
    setIsFindPasswordOpen(false)
    setEmailToken(payload.emailToken)
    setIsResetPasswordOpen(true)
  }

  return {
    modals: {
      findId: { isOpen: isFindIdOpen, close: closeFindId },
      findIdResult: {
        isOpen: isFindIdResultOpen,
        close: closeFindIdResult,
        maskedEmail,
      },
      findPassword: {
        isOpen: isFindPasswordOpen,
        close: closeFindPassword,
      },
      resetPassword: {
        isOpen: isResetPasswordOpen,
        close: closeResetPassword,
        emailToken,
      },
    },
    actions: {
      openFindId,
      handleFindIdSuccess,
      openFindPassword,
      goToFindPasswordFromResult,
      openResetPasswordWithToken,
    },
  }
}

/** 로그인 폼 초기값 */
const LOGIN_DEFAULT_VALUES: LoginFormData = { email: '', password: '' }

/** 리다이렉트 경로 추출 */
function getRedirectPath(locationState: unknown): string {
  const state = locationState as { from?: string } | null
  return typeof state?.from === 'string' ? state.from : '/'
}

/** 입력 변경 시 root 에러 초기화 */
function useClearRootErrorOnInputChange(
  email: string,
  password: string,
  rootError: string | null,
  clearErrors: (name: 'root') => void
) {
  const prevInputKeyRef = useRef('')
  useEffect(() => {
    const inputKey = `${email}|${password}`
    if (prevInputKeyRef.current === inputKey) return
    prevInputKeyRef.current = inputKey
    if (rootError) clearErrors('root')
  }, [email, password, rootError, clearErrors])
}

function useLoginForm() {
  const navigate = useNavigate()
  const location = useLocation()
  const login = useAuthStore((s) => s.login)

  const redirectPath = useMemo(
    () => getRedirectPath(location.state),
    [location.state]
  )

  const methods = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: LOGIN_DEFAULT_VALUES,
    mode: 'onChange',
    reValidateMode: 'onChange',
    shouldFocusError: true,
  })

  const {
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
    control,
    setError,
    clearErrors,
  } = methods

  const rootError = errors.root?.message ?? null
  const watched = useWatch({ control }) as Partial<LoginFormData>
  const emailValue = (watched.email ?? '').toString()
  const passwordValue = (watched.password ?? '').toString()

  useClearRootErrorOnInputChange(
    emailValue,
    passwordValue,
    rootError,
    clearErrors
  )

  const handleLoginSubmit = handleSubmit(async (formData) => {
    clearErrors('root')
    try {
      await login(formData)
      navigate(redirectPath, { replace: true })
    } catch (error) {
      const mappedError = mapLoginError(error)
      setError('root', { type: 'server', message: mappedError.message })
    }
  })

  const submitButton = useMemo(
    () => ({
      label: isSubmitting
        ? AUTH_MESSAGES.login.submitBusy
        : AUTH_MESSAGES.login.submitLabel,
      disabled: !isValid || isSubmitting,
      variant: (!isValid || isSubmitting ? 'disabled' : 'primary') as
        | 'disabled'
        | 'primary',
    }),
    [isValid, isSubmitting]
  )

  return { methods, onSubmit: handleLoginSubmit, rootError, submitButton }
}

export default function LoginPage() {
  const accountRecovery = useAccountRecoveryModals()
  const { methods, onSubmit, rootError, submitButton } = useLoginForm()

  const handleSocialLogin = (provider: SocialProviderId) => {
    createSocialRedirect(provider)
  }

  return (
    <FormProvider {...methods}>
      <div className="flex h-[calc(100vh-96px)] items-center justify-center bg-white px-4 py-12">
        <div className="relative mb-[min(20vh)] flex w-[348px] flex-col items-center gap-16">
          {/* 로고, 회원가입 */}
          <div className="flex w-full flex-col items-center gap-[27px]">
            <div className="flex w-[191px] flex-col items-center gap-4">
              <img
                className="h-6 w-[180px] object-cover"
                alt="Renewal ozcoding"
                src="/LoginPage_img/ozcoding_logo.png"
              />
            </div>
            <div className="flex w-full items-start justify-center gap-3">
              <div className="inline-flex items-center justify-center gap-2.5">
                <div className="text-mono-600 truncate whitespace-nowrap">
                  아직 회원이 아니신가요?
                </div>
              </div>
              <Link
                to="/signup"
                className="text-primary gap-2.5 text-[16px] leading-[22.4px] font-normal tracking-[-0.48px] whitespace-nowrap"
              >
                회원가입 하기
              </Link>
            </div>
          </div>

          {/* 로그인 폼 */}
          <div className="flex w-full flex-col items-center">
            <div className="flex w-full flex-col items-start gap-10">
              <SocialLoginSection onLogin={handleSocialLogin} />

              <form onSubmit={onSubmit} className="w-full">
                <div className="flex flex-col items-start">
                  <div className="flex w-full flex-col gap-3">
                    <CommonInputField<LoginFormData>
                      name="email"
                      type="email"
                      placeholder="아이디 (example@gmail.com)"
                      width="100%"
                      placeholderVariant="a"
                      state="default"
                      stateOverride="default"
                      helperVisibility="focus"
                      helperTextByState={{ default: null }}
                    />
                    <div className="flex w-full flex-col">
                      <PasswordField<LoginFormData>
                        name="password"
                        placeholder="비밀번호를 입력해주세요."
                        width="100%"
                        placeholderVariant="a"
                        state="default"
                        stateOverride="default"
                        helperVisibility="never"
                        showDefaultHelper={false}
                      />
                    </div>
                    <FormErrorDisplay message={rootError} className="text-xs" />
                  </div>

                  <div className="inline-flex items-center">
                    <Button
                      type="button"
                      variant="link"
                      size="auto"
                      className="py-2 whitespace-nowrap"
                      onClick={accountRecovery.actions.openFindId}
                    >
                      아이디 찾기
                    </Button>
                    <span className="text-mono-600 px-2 py-2 text-sm">|</span>
                    <Button
                      type="button"
                      variant="link"
                      size="auto"
                      className="py-2 whitespace-nowrap"
                      onClick={accountRecovery.actions.openFindPassword}
                    >
                      비밀번호 찾기
                    </Button>
                  </div>

                  <Button
                    type="submit"
                    disabled={submitButton.disabled}
                    variant={submitButton.variant}
                    className="h-[52px] w-full gap-2.5 rounded px-2 py-2"
                  >
                    <div className="whitespace-nowrap">
                      {submitButton.label}
                    </div>
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <FindIdModal
        isOpen={accountRecovery.modals.findId.isOpen}
        onClose={accountRecovery.modals.findId.close}
        onFindIdSuccess={accountRecovery.actions.handleFindIdSuccess}
      />
      <FindIdResultModal
        isOpen={accountRecovery.modals.findIdResult.isOpen}
        onClose={accountRecovery.modals.findIdResult.close}
        maskedEmail={accountRecovery.modals.findIdResult.maskedEmail}
        onFindPasswordClick={accountRecovery.actions.goToFindPasswordFromResult}
      />
      <FindPasswordModal
        isOpen={accountRecovery.modals.findPassword.isOpen}
        onClose={accountRecovery.modals.findPassword.close}
        onVerified={accountRecovery.actions.openResetPasswordWithToken}
      />
      <ResetPasswordModal
        isOpen={accountRecovery.modals.resetPassword.isOpen}
        onClose={accountRecovery.modals.resetPassword.close}
        initialToken={accountRecovery.modals.resetPassword.emailToken}
      />
    </FormProvider>
  )
}
