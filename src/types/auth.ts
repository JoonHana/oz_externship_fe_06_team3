export type LoginPayload = {
  email: string
  password: string
}

export type LoginResult = {
  access_token: string
}

export type VerifyEmailResult = {
  detail?: string
  email_token: string
}

export type VerifySmsResult = {
  detail?: string
  sms_token: string
}

export type SignupPayload = {
  password: string
  password_confirm: string
  nickname: string
  name: string
  birthday: string
  gender: 'M' | 'F'
  email_token: string
  sms_token: string
}

export type User = {
  id: number
  email: string
  nickname: string
  name: string
  phone_number: string
  birthday: string
  gender: 'M' | 'F'
  profile_img_url?: string | null
  created_at?: string
}
