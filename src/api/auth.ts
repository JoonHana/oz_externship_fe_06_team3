import { apiClient } from '@/api/client'

type SendSmsRequestDTO = { phone_number: string }
type VerifySmsRequestDTO = { phone_number: string; code: string }
type VerifySmsResponseDTO = { sms_token: string; detail?: string }
type VerifyEmailResponseDTO = { email_token: string; detail?: string }
type FindEmailRequestDTO = { name: string; sms_token: string }
type FindPasswordRequestDTO = { email_token: string; new_password: string }
type SignupRequestDTO = {
  password: string
  password_confirm: string
  nickname: string
  name: string
  birthday: string
  gender: 'M' | 'F'
  email_token: string
  sms_token: string
}

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

function mapVerifyEmailResponse(
  dto: VerifyEmailResponseDTO
): VerifyEmailResult {
  return { emailToken: dto.email_token, detail: dto.detail }
}
function mapVerifySmsResponse(dto: VerifySmsResponseDTO): VerifySmsResult {
  return { smsToken: dto.sms_token, detail: dto.detail }
}
function mapResetPasswordPayload(
  p: ResetPasswordPayload
): FindPasswordRequestDTO {
  return { email_token: p.emailToken, new_password: p.newPassword }
}
function mapSignupPayload(p: SignupPayload): SignupRequestDTO {
  return {
    password: p.password,
    password_confirm: p.passwordConfirm,
    nickname: p.nickname,
    name: p.name,
    birthday: p.birthday,
    gender: p.gender,
    email_token: p.emailToken,
    sms_token: p.smsToken,
  }
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
  return mapVerifyEmailResponse(data)
}

export async function sendSmsVerification(
  payload: { phoneNumber: string },
  options?: ApiOptions
): Promise<void> {
  const dto: SendSmsRequestDTO = { phone_number: payload.phoneNumber }
  await apiClient.post(
    '/api/v1/accounts/verification/send-sms/',
    dto,
    options?.signal ? { signal: options.signal } : {}
  )
}

export async function verifySmsCode(
  payload: { phoneNumber: string; verificationCode: string },
  options?: ApiOptions
): Promise<VerifySmsResult> {
  const dto: VerifySmsRequestDTO = {
    phone_number: payload.phoneNumber,
    code: payload.verificationCode,
  }
  const { data } = await apiClient.post<VerifySmsResponseDTO>(
    '/api/v1/accounts/verification/verify-sms/',
    dto,
    options?.signal ? { signal: options.signal } : {}
  )
  return mapVerifySmsResponse(data)
}

export async function signup(payload: SignupPayload): Promise<void> {
  await apiClient.post('/api/v1/accounts/signup/', mapSignupPayload(payload))
}

export async function findMaskedEmail(
  payload: FindMaskedEmailPayload,
  options?: ApiOptions
): Promise<FindMaskedEmailResult> {
  const dto: FindEmailRequestDTO = {
    name: payload.name,
    sms_token: payload.smsToken,
  }
  const { data } = await apiClient.post<{ email: string }>(
    '/api/v1/accounts/find-email/',
    dto,
    options?.signal ? { signal: options.signal } : {}
  )
  return { maskedEmail: data.email }
}

export async function resetPassword(
  payload: ResetPasswordPayload
): Promise<void> {
  await apiClient.post(
    '/api/v1/accounts/find-password/',
    mapResetPasswordPayload(payload)
  )
}
