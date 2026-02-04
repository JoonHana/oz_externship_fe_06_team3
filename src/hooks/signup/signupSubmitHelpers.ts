import * as authApi from '@/api/auth'
import type { LoginPayload } from '@/types/auth'
import { formatBirthday, mapGender } from '@/utils/signupUtils'
import { mapSignupError } from '@/utils/error/authEndpointErrorMapper'
import { normalizeEmail } from '@/utils/normalize'
import { AUTH_MESSAGES } from '@/constants/authMessages'
// 회원가입 제출 - 검증/포맷팅(validateAndFormatSignupData), API 호출(executeSignupAndLogin)
import type { SignupFormData } from '@/schemas/auth'

export type ValidateAndFormatResult =
  | { success: true; formattedBirthday: string }
  | { success: false; errorMessage: string }

export function validateAndFormatSignupData(
  data: SignupFormData,
  validatePrerequisites: () => string | null
): ValidateAndFormatResult {
  const prerequisiteError = validatePrerequisites()
  if (prerequisiteError) {
    return { success: false, errorMessage: prerequisiteError }
  }

  const formattedBirthday = formatBirthday(data.birthdate)
  if (!formattedBirthday) {
    return {
      success: false,
      errorMessage: AUTH_MESSAGES.form.birthdateFormat,
    }
  }

  return { success: true, formattedBirthday }
}

export type ExecuteSignupParams = {
  data: SignupFormData
  formattedBirthday: string
  emailToken: string
  smsToken: string
  authLogin: (payload: LoginPayload) => Promise<void>
}

export async function executeSignupAndLogin({
  data,
  formattedBirthday,
  emailToken,
  smsToken,
  authLogin,
}: ExecuteSignupParams): Promise<
  { success: true } | { success: false; errorMessage: string }
> {
  try {
    await authApi.signup({
      password: data.password,
      passwordConfirm: data.passwordConfirm,
      nickname: data.nickname.trim(),
      name: data.name.trim(),
      birthday: formattedBirthday,
      gender: mapGender(data.gender),
      emailToken,
      smsToken,
    })

    await authLogin({
      email: normalizeEmail(data.email),
      password: data.password,
    })

    return { success: true }
  } catch (error) {
    const mappedError = mapSignupError(error)
    return { success: false, errorMessage: mappedError.message }
  }
}
