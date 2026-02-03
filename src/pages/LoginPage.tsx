// 로그인 + 아이디/비밀번호 찾기. 에러는 errors.root로.
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
import { FindIdModalContainer } from '@/components/auth/FindIdModalContainer'
import { FindPasswordModalContainer } from '@/components/auth/FindPasswordModalContainer'
import type { SocialProviderId } from '@/types/social'
import type { FindPasswordVerifiedPayload } from '@/hooks/flow'

import { useAuthStore } from '@/store/authStore'
import { loginSchema, type LoginFormData } from '@/schemas/auth'
import { AUTH_MESSAGES } from '@/constants/authMessages'
import { mapLoginError } from '@/utils/error/authEndpointErrorMapper'
import { createSocialRedirect } from '@/lib/auth'

// 찾기 모달 열기/닫기, 결과→비밀번호찾기→재설정 전환
function useRecoveryModals() {
  const [findIdOpen, setFindIdOpen] = useState(false)
  const [findIdResultOpen, setFindIdResultOpen] = useState(false)
  const [maskedEmail, setMaskedEmail] = useState('')
  const [findPasswordOpen, setFindPasswordOpen] = useState(false)
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false)
  const [emailToken, setEmailToken] = useState<string | null>(null)

  return {
    modals: {
      findId: { isOpen: findIdOpen, close: () => setFindIdOpen(false) },
      findIdResult: {
        isOpen: findIdResultOpen,
        close: () => setFindIdResultOpen(false),
        maskedEmail,
      },
      findPassword: {
        isOpen: findPasswordOpen,
        close: () => setFindPasswordOpen(false),
      },
      resetPassword: {
        isOpen: resetPasswordOpen,
        close: () => {
          setResetPasswordOpen(false)
          setEmailToken(null)
        },
        emailToken,
      },
    },
    actions: {
      openFindId: () => setFindIdOpen(true),
      handleFindIdSuccess: (email: string) => {
        setFindIdOpen(false)
        setMaskedEmail(email)
        setFindIdResultOpen(true)
      },
      openFindPassword: () => setFindPasswordOpen(true),
      goToPasswordFromResult: () => {
        setFindIdResultOpen(false)
        setFindPasswordOpen(true)
      },
      openResetPassword: (payload: FindPasswordVerifiedPayload) => {
        setFindPasswordOpen(false)
        setEmailToken(payload.emailToken)
        setResetPasswordOpen(true)
      },
    },
  }
}

function useLoginForm() {
  const navigate = useNavigate()
  const location = useLocation()
  const authLogin = useAuthStore((s) => s.login)

  const from = useMemo(() => {
    const state = location.state as { from?: string } | null
    return typeof state?.from === 'string' ? state.from : '/'
  }, [location.state])

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

  const watched = useWatch({ control }) as Partial<LoginFormData>
  const email = (watched.email ?? '').toString()
  const password = (watched.password ?? '').toString()
  const prevInputKeyRef = useRef('')
  useEffect(() => {
    const key = `${email}|${password}`
    if (prevInputKeyRef.current === key) return
    prevInputKeyRef.current = key
    if (rootError) clearErrors('root')
  }, [email, password, rootError, clearErrors])

  const onSubmit = handleSubmit(async (data) => {
    clearErrors('root')
    try {
      await authLogin(data)
      navigate(from, { replace: true })
    } catch (err) {
      const mapped = mapLoginError(err)
      setError('root', { type: 'server', message: mapped.message })
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

  return { methods, onSubmit, rootError, submitButton }
}

// 로그인 페이지
export default function LoginPage() {
  const recovery = useRecoveryModals()
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
                      onClick={recovery.actions.openFindId}
                    >
                      아이디 찾기
                    </Button>
                    <span className="text-mono-600 px-2 py-2 text-sm">|</span>
                    <Button
                      type="button"
                      variant="link"
                      size="auto"
                      className="py-2 whitespace-nowrap"
                      onClick={recovery.actions.openFindPassword}
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

      <FindIdModalContainer
        isOpen={recovery.modals.findId.isOpen}
        onClose={recovery.modals.findId.close}
        onFindIdSuccess={recovery.actions.handleFindIdSuccess}
      />
      <FindIdResultModal
        isOpen={recovery.modals.findIdResult.isOpen}
        onClose={recovery.modals.findIdResult.close}
        maskedEmail={recovery.modals.findIdResult.maskedEmail}
        onFindPasswordClick={recovery.actions.goToPasswordFromResult}
      />
      <FindPasswordModalContainer
        isOpen={recovery.modals.findPassword.isOpen}
        onClose={recovery.modals.findPassword.close}
        onVerified={recovery.actions.openResetPassword}
      />
      <ResetPasswordModal
        isOpen={recovery.modals.resetPassword.isOpen}
        onClose={recovery.modals.resetPassword.close}
        initialToken={recovery.modals.resetPassword.emailToken}
      />
    </FormProvider>
  )
}
