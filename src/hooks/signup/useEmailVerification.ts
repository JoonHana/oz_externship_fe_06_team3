import { z } from 'zod'
// 회원가입 이메일 인증 - useVerificationFlow 래핑
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
const emailZ = z.string().trim().email()

type UseEmailVerificationArgs = {
  email: string
  emailVerificationCode: string
  busy: boolean
  setBusy: (v: boolean) => void
  clearErrors: (names: Path<SignupFormData> | Path<SignupFormData>[]) => void
  setFieldError: (name: Path<SignupFormData>, message: string) => void
}

export function useEmailVerification({
  email,
  emailVerificationCode,
  busy,
  setBusy,
  clearErrors,
  setFieldError,
}: UseEmailVerificationArgs) {
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
