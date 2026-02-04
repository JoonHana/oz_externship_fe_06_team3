// 로그인/회원가입 등 인증 관련 타입 정의
export type LoginPayload = {
  email: string
  password: string
}

export type LoginResult = {
  access_token: string
  refresh_token: string
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
