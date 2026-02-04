// 회원가입 SMS 인증 - useVerificationFlow 래핑
import type { Path } from 'react-hook-form'
import type { SignupFormData } from '@/schemas/auth'
import { useVerificationFlow } from '@/hooks/useVerificationFlow'
import * as authApi from '@/api/auth'
import {
  mapSendSmsError,
  mapVerifySmsError,
} from '@/utils/error/authEndpointErrorMapper'
import { AUTH_MESSAGES } from '@/constants/authMessages'
import {
  SMS_VERIFICATION_TTL_SECONDS,
} from '@/constants/auth'

type UseSmsVerificationArgs = {
  phoneNumber: string
  phone2: string
  phone3: string
  phoneVerificationCode: string
  busy: boolean
  setBusy: (v: boolean) => void
  clearErrors: (names: Path<SignupFormData> | Path<SignupFormData>[]) => void
  setFieldError: (name: Path<SignupFormData>, message: string) => void
}

export function useSmsVerification({
  phoneNumber,
  phone2,
  phone3,
  phoneVerificationCode,
  busy,
  setBusy,
  clearErrors,
  setFieldError,
}: UseSmsVerificationArgs) {
  return useVerificationFlow({
    identity: phoneNumber,
    code: phoneVerificationCode,
    ttlSec: SMS_VERIFICATION_TTL_SECONDS,
    busy,
    setBusy,
    clearErrors,
    setFieldError,

    identityFields: ['phone2', 'phone3'],
    codeField: 'phoneVerificationCode',

    validateIdentity: () => {
      const PHONE_DIGIT_REGEX = /^\d{4}$/
      const isPhone2Valid = PHONE_DIGIT_REGEX.test(phone2)
      const isPhone3Valid = PHONE_DIGIT_REGEX.test(phone3)
      if (!isPhone2Valid || !isPhone3Valid) {
        return {
          ok: false,
          message: AUTH_MESSAGES.sms.identityInvalid,
          fieldErrors: {
            ...(isPhone2Valid ? {} : { phone2: AUTH_MESSAGES.sms.phoneDigitError }),
            ...(isPhone3Valid ? {} : { phone3: AUTH_MESSAGES.sms.phoneDigitError }),
          },
        }
      }
      if (phoneNumber.length < 10) {
        return {
          ok: false,
          message: AUTH_MESSAGES.sms.identityInvalid,
        }
      }
      return { ok: true }
    },

    send: (identity) => authApi.sendSmsVerification({ phoneNumber: identity }),
    verify: (identity, verificationCode) =>
      authApi.verifySmsCode({ phoneNumber: identity, verificationCode }),
    getToken: (response) => response.smsToken,

    getSendErrorMessage: (err) => mapSendSmsError(err).message,
    getVerifyErrorMessage: (err) => mapVerifySmsError(err).message,

    text: {
      sent: AUTH_MESSAGES.sms.sendSuccess,
      resent: AUTH_MESSAGES.sms.sendResent,
      identityInvalid: AUTH_MESSAGES.sms.identityInvalid,
      codeRequired: AUTH_MESSAGES.sms.codeRequired,
      expired: AUTH_MESSAGES.sms.expired,
      verifySuccess: AUTH_MESSAGES.sms.verifySuccess,
    },
  })
}
