// 이메일 인증 (인증번호 전송 → 인증번호 입력 → 인증 완료) - useVerificationFlow 래핑
import { z } from 'zod'
import type { Path } from 'react-hook-form'
import type { SignupFormData } from '@/schemas/auth'
import { useVerificationFlow } from '@/hooks/useVerificationFlow'
import * as authApi from '@/api/auth'
import {
  mapSendEmailError,
  mapVerifyEmailError,
} from '@/utils/error/authEndpointErrorMapper'
import { AUTH_MESSAGES } from '@/constants/authMessages'
import { EMAIL_VERIFICATION_TTL_SECONDS } from '@/constants/auth'

// 이메일 유효성 검사
const emailZ = z.string().trim().email()

type UseEmailVerificationArgs = {
  email: string
  emailVerificationCode: string
  busy: boolean
  setBusy: (v: boolean) => void
  clearErrors: (names: Path<SignupFormData> | Path<SignupFormData>[]) => void
  setFieldError: (name: Path<SignupFormData>, message: string) => void
}

// 이메일 인증 훅
export function useEmailVerification({
  email,
  emailVerificationCode,
  busy,
  setBusy,
  clearErrors,
  setFieldError,
}: UseEmailVerificationArgs) {
  // 공통 인증 플로우로 위임
  return useVerificationFlow({
    identity: email,
    code: emailVerificationCode,
    ttlSec: EMAIL_VERIFICATION_TTL_SECONDS,
    busy,
    setBusy,
    clearErrors,
    setFieldError,

    identityFields: ['email'],
    codeField: 'emailVerificationCode',

    validateIdentity: (emailValue) => {
      // 이메일 유효성 검사 성공 결과만 추출
      const ok = emailZ.safeParse(emailValue).success
      return ok
        ? { ok: true }
        : { ok: false, message: AUTH_MESSAGES.email.identityInvalid }
    },

    send: (identity) => authApi.sendEmailVerification({ email: identity }),
    verify: (identity, verificationCode) =>
      authApi.verifyEmailCode({ email: identity, verificationCode }),
    getToken: (response) => response.emailToken,

    getSendErrorMessage: (err) => mapSendEmailError(err).message,
    getVerifyErrorMessage: (err) => mapVerifyEmailError(err).message,

    text: {
      sent: AUTH_MESSAGES.email.sendSuccess,
      resent: AUTH_MESSAGES.email.sendResent,
      identityInvalid: AUTH_MESSAGES.email.identityInvalid,
      codeRequired: AUTH_MESSAGES.email.codeRequired,
      expired: AUTH_MESSAGES.email.expired,
      verifySuccess: AUTH_MESSAGES.email.verifySuccess,
    },
  })
}
