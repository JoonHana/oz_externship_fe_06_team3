import { apiClient } from '@/api/client'

type VerifySmsResponseDTO = { sms_token: string; detail?: string }
type VerifyEmailResponseDTO = { email_token: string; detail?: string }

export type VerifyEmailResult = { emailToken: string; detail?: string }
export type VerifySmsResult = { smsToken: string; detail?: string }
export type FindMaskedEmailPayload = { name: string; smsToken: string }
export type FindMaskedEmailResult = { maskedEmail: string }
export type ResetPasswordPayload = { emailToken: string; newPassword: string }
export type SignupPayload = {
  password: string
  passwordConfirm: string
  nickname: string
  name: string
  birthday: string
  gender: 'M' | 'F'
  emailToken: string
  smsToken: string
}

import type { LoginPayload, LoginResult, User } from '@/types/auth'

export async function login(payload: LoginPayload): Promise<LoginResult> {
  const { data } = await apiClient.post<LoginResult>(
    '/api/v1/accounts/login/',
    payload
  )
  return data
}

export async function logout(): Promise<void> {
  await apiClient.post('/api/v1/accounts/logout/')
}

export async function me(accessToken: string | null = null): Promise<User> {
  const config =
    accessToken && accessToken !== ''
      ? { headers: { Authorization: `Bearer ${accessToken}` } }
      : undefined

  const { data } = await apiClient.get<User>('/api/v1/accounts/me/', config)
  return data
}

export async function checkNickname(payload: {
  nickname: string
}): Promise<void> {
  await apiClient.post('/api/v1/accounts/check-nickname/', payload)
}

type ApiOptions = { signal?: AbortSignal }

export async function sendEmailVerification(
  payload: { email: string },
  options?: ApiOptions
): Promise<void> {
  await apiClient.post(
    '/api/v1/accounts/verification/send-email/',
    payload,
    options?.signal ? { signal: options.signal } : {}
  )
}

export async function verifyEmailCode(
  payload: { email: string; verificationCode: string },
  options?: ApiOptions
): Promise<VerifyEmailResult> {
  const { data } = await apiClient.post<VerifyEmailResponseDTO>(
    '/api/v1/accounts/verification/verify-email/',
    { email: payload.email, code: payload.verificationCode },
    options?.signal ? { signal: options.signal } : {}
  )
  return { emailToken: data.email_token, detail: data.detail }
}

export async function sendSmsVerification(
  payload: { phoneNumber: string },
  options?: ApiOptions
): Promise<void> {
  await apiClient.post(
    '/api/v1/accounts/verification/send-sms/',
    { phone_number: payload.phoneNumber },
    options?.signal ? { signal: options.signal } : {}
  )
}

export async function verifySmsCode(
  payload: { phoneNumber: string; verificationCode: string },
  options?: ApiOptions
): Promise<VerifySmsResult> {
  const { data } = await apiClient.post<VerifySmsResponseDTO>(
    '/api/v1/accounts/verification/verify-sms/',
    {
      phone_number: payload.phoneNumber,
      code: payload.verificationCode,
    },
    options?.signal ? { signal: options.signal } : {}
  )
  return { smsToken: data.sms_token, detail: data.detail }
}

export async function signup(payload: SignupPayload): Promise<void> {
  await apiClient.post('/api/v1/accounts/signup/', {
    password: payload.password,
    password_confirm: payload.passwordConfirm,
    nickname: payload.nickname,
    name: payload.name,
    birthday: payload.birthday,
    gender: payload.gender,
    email_token: payload.emailToken,
    sms_token: payload.smsToken,
  })
}

export async function findMaskedEmail(
  payload: FindMaskedEmailPayload,
  options?: ApiOptions
): Promise<FindMaskedEmailResult> {
  const { data } = await apiClient.post<{ email: string }>(
    '/api/v1/accounts/find-email/',
    { name: payload.name, sms_token: payload.smsToken },
    options?.signal ? { signal: options.signal } : {}
  )
  return { maskedEmail: data.email }
}

export async function resetPassword(
  payload: ResetPasswordPayload
): Promise<void> {
  await apiClient.post('/api/v1/accounts/find-password/', {
    email_token: payload.emailToken,
    new_password: payload.newPassword,
  })
}
