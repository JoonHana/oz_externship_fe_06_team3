// 로그인 페이지 - 일반 로그인 + 소셜 로그인 + 아이디/비밀번호 찾기 모달
import { FormProvider } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { CommonInputField } from '@/components/common/CommonInputField'
import { PasswordField } from '@/components/common/PasswordField'
import { Button } from '@/components/common/Button'
import { FormErrorDisplay } from '@/components/common/FormErrorDisplay'
import MockAuthHelpPanel, {
  type MockAuthHelpPanelVariant,
} from '@/components/auth/MockAuthHelpPanel'
import SocialLoginSection from '@/components/auth/SocialLoginSection'
import {
  FindIdModal,
  FindIdResultModal,
  EmailVerificationModal,
  ResetPasswordModal,
  RestoreAccountResultModal,
  WithdrawnMemberModal,
} from '@/components/common/Modal/auth'
import type { SocialProviderId } from '@/types/social'
import type { LoginFormData } from '@/schemas/auth'

import { useAuthStore } from '@/store/authStore'
import {
  useLoginForm,
  useAccountRecoveryModals,
  useWithdrawnMemberFlow,
} from '@/hooks/login'
import { mapLoginError } from '@/utils/error/authEndpointErrorMapper'
import { parseAxiosError } from '@/utils/error/axiosErrorParser'
import { createSocialRedirect } from '@/api/socialAuth'

// 로그인 페이지 컴포넌트
export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const login = useAuthStore((state) => state.login)
  const isMockMode = import.meta.env.VITE_USE_MSW === 'true'

  const { methods, rootError, submitButton } = useLoginForm()
  const accountRecovery = useAccountRecoveryModals()
  const withdrawnMemberFlow = useWithdrawnMemberFlow(navigate)

  const { handleSubmit, setError, clearErrors } = methods
  const redirectPath = getRedirectPathFromLocation(location.state)
  const helpPanelVariant = getMockAuthHelpPanelVariant({
    isFindIdOpen:
      accountRecovery.modals.findId.isOpen ||
      accountRecovery.modals.findIdResult.isOpen,
    isFindPasswordOpen:
      accountRecovery.modals.findPassword.isOpen ||
      accountRecovery.modals.resetPassword.isOpen,
    isRestoreOpen:
      withdrawnMemberFlow.modals.withdrawn.isOpen ||
      withdrawnMemberFlow.modals.restore.isOpen ||
      withdrawnMemberFlow.modals.result.isOpen,
  })

  // 로그인 제출 플로우
  const handleLoginSubmit = handleSubmit(async (formData) => {
    // 이전 에러 초기화
    clearErrors('root')

    try {
      const loginPayload = isMockMode
        ? {
            email: formData.email.trim(),
            password: formData.password.trim(),
          }
        : formData

      await login(loginPayload)
      // 로그인 성공 시 원래 가려던 페이지로 이동
      navigate(redirectPath, { replace: true })
    } catch (error) {
      // 탈퇴한 회원(403)인 경우 탈퇴회원 복구 플로우 시작
      const parsedError = parseAxiosError(error)
      const isWithdrawnMemberError = parsedError.status === 403
      if (isWithdrawnMemberError) {
        withdrawnMemberFlow.actions.openWithdrawnModal()
        return
      }
      // 일반 에러인 경우
      const mappedError = mapLoginError(error)
      setError('root', {
        type: 'server',
        message: mappedError.message,
      })
    }
  })

  // 소셜 로그인 리다이렉트
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

              <form onSubmit={handleLoginSubmit} className="w-full">
                <div className="flex flex-col items-start">
                  <div className="flex w-full flex-col gap-3">
                    <CommonInputField<LoginFormData>
                      name="email"
                      type="email"
                      placeholder="아이디 (example@gmail.com)"
                      width="100%"
                      placeholderVariant="a"
                      state="default"
                      stateOverride={rootError ? 'error' : undefined}
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
                        stateOverride={rootError ? 'error' : undefined}
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

      <MockAuthHelpPanel variant={helpPanelVariant} />

      {/* 아이디/비밀번호 찾기 모달 */}
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

      {/* 탈퇴회원 복구 플로우 모달 */}
      <WithdrawnMemberModal
        isOpen={withdrawnMemberFlow.modals.withdrawn.isOpen}
        onClose={withdrawnMemberFlow.modals.withdrawn.close}
        onRestoreAccount={withdrawnMemberFlow.actions.handleStartRestore}
      />
      <EmailVerificationModal
        isOpen={withdrawnMemberFlow.modals.restore.isOpen}
        onClose={withdrawnMemberFlow.modals.restore.close}
        mode="restoreAccount"
        onSubmitVerified={withdrawnMemberFlow.actions.handleRestoreVerified}
      />
      <RestoreAccountResultModal
        isOpen={withdrawnMemberFlow.modals.result.isOpen}
        onClose={withdrawnMemberFlow.modals.result.close}
      />
    </FormProvider>
  )
}

// 로그인 성공 후 어디로 이동할지 결정
function getRedirectPathFromLocation(locationState: unknown): string {
  const state = locationState as { from?: string } | null
  return typeof state?.from === 'string' ? state.from : '/'
}

function getMockAuthHelpPanelVariant(params: {
  isFindIdOpen: boolean
  isFindPasswordOpen: boolean
  isRestoreOpen: boolean
}): MockAuthHelpPanelVariant {
  if (params.isRestoreOpen) return 'restore-account'
  if (params.isFindPasswordOpen) return 'find-password'
  if (params.isFindIdOpen) return 'find-id'
  return 'login'
}
