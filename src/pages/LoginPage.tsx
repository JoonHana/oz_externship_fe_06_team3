// 로그인 페이지 - 일반 로그인 + 소셜 로그인 + 아이디/비밀번호 찾기 모달
import { useEffect, useMemo, useRef, useState } from 'react'
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
  RestoreAccountResultModal,
  WithdrawnMemberModal,
} from '@/components/common/Modal'
import {
  FindIdModal,
  EmailVerificationModal,
} from '@/components/common/Modal/variants'
import type { SocialProviderId } from '@/types/social'

import { useAuthStore } from '@/store/authStore'
import { useAccountRecoveryModals } from '@/hooks/useAccountRecoveryModals'
import { loginSchema, type LoginFormData } from '@/schemas/auth'
import { AUTH_MESSAGES } from '@/constants/authMessages'
import { mapLoginError } from '@/utils/error/authEndpointErrorMapper'
import { parseAxiosError } from '@/utils/error/axiosErrorParser'
import { createSocialRedirect } from '@/api/socialAuth'
import { restoreAccount } from '@/api/auth'

// 로그인 성공 후 어디로 이동할지 결정
function getRedirectPathFromLocation(locationState: unknown): string {
  const state = locationState as { from?: string } | null
  return typeof state?.from === 'string' ? state.from : '/'
}

// 사용자가 입력을 바꾸면 에러 메시지를 자동으로 지움
function useClearRootErrorOnInputChange(
  emailValue: string,
  passwordValue: string,
  rootError: string | null,
  clearErrors: (name?: 'root') => void
) {
  const previousFormValuesKeyRef = useRef('')
  useEffect(() => {
    const formValuesKey = `${emailValue}|${passwordValue}`
    if (previousFormValuesKeyRef.current === formValuesKey) return
    previousFormValuesKeyRef.current = formValuesKey
    if (rootError) clearErrors('root')
  }, [emailValue, passwordValue, rootError, clearErrors])
}

function useLoginForm(onWithdrawnMember?: () => void) {
  const navigate = useNavigate()
  const location = useLocation()
  const login = useAuthStore((state) => state.login)

  const redirectPath = useMemo(
    () => getRedirectPathFromLocation(location.state),
    [location.state]
  )

  const methods = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
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
  const watchedFormValues = useWatch({ control }) as Partial<LoginFormData>
  const emailValue = (watchedFormValues.email ?? '').toString()
  const passwordValue = (watchedFormValues.password ?? '').toString()

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
      const parsedError = parseAxiosError(error)
      if (parsedError.status === 403) {
        onWithdrawnMember?.()
        return
      }
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

// 로그인 페이지 컴포넌트
export default function LoginPage() {
  const accountRecovery = useAccountRecoveryModals()
  const [withdrawnMemberOpen, setWithdrawnMemberOpen] = useState(false)
  const [restoreAccountOpen, setRestoreAccountOpen] = useState(false)
  const [restoreResultOpen, setRestoreResultOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (!restoreResultOpen) return
    const timer = setTimeout(() => {
      setRestoreResultOpen(false)
      navigate('/login', { replace: true })
    }, 2000)
    return () => clearTimeout(timer)
  }, [navigate, restoreResultOpen])

  const handleRestoreVerified = async (payload: { email: string; emailToken: string }) => {
    await restoreAccount({ emailToken: payload.emailToken })
    setRestoreAccountOpen(false)
    setRestoreResultOpen(true)
  }
  const { methods, onSubmit, rootError, submitButton } = useLoginForm(() =>
    setWithdrawnMemberOpen(true)
  )

  const handleSocialLogin = (provider: SocialProviderId) => {
    createSocialRedirect(provider)
  }

  return (
    <FormProvider {...methods}>
      <div className="flex min-h-[calc(100vh-96px)] items-center justify-center px-4 py-12">
        <div className="relative mb-[min(20vh)] flex w-[348px] flex-col items-center gap-16">
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
                className="text-primary gap-2.5 text-[16px] whitespace-nowrap"
              >
                회원가입 하기
              </Link>
            </div>
          </div>

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
      <EmailVerificationModal
        isOpen={accountRecovery.modals.findPassword.isOpen}
        onClose={accountRecovery.modals.findPassword.close}
        onVerified={accountRecovery.actions.openResetPasswordWithToken}
      />
      <ResetPasswordModal
        isOpen={accountRecovery.modals.resetPassword.isOpen}
        onClose={accountRecovery.modals.resetPassword.close}
        initialToken={accountRecovery.modals.resetPassword.emailToken}
      />
      <EmailVerificationModal
        isOpen={restoreAccountOpen}
        onClose={() => setRestoreAccountOpen(false)}
        mode="restoreAccount"
        onSubmitVerified={handleRestoreVerified}
      />
      <RestoreAccountResultModal
        isOpen={restoreResultOpen}
        onClose={() => setRestoreResultOpen(false)}
      />
      <WithdrawnMemberModal
        isOpen={withdrawnMemberOpen}
        onClose={() => setWithdrawnMemberOpen(false)}
        onRestoreAccount={() => {
          setWithdrawnMemberOpen(false)
          setRestoreAccountOpen(true)
        }}
      />
    </FormProvider>
  )
}
