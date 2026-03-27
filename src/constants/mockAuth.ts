import type { LoginPayload, User } from '@/types/auth'

export const MOCK_LOGIN_CREDENTIALS: LoginPayload = {
  email: 'test@example.com',
  password: 'Test123!',
}

export const MOCK_LOGIN_USER: User = {
  id: 1,
  email: MOCK_LOGIN_CREDENTIALS.email,
  nickname: '테스트유저',
  name: '테스트 유저',
  phone_number: '01012345678',
  birthday: '2000-01-01',
  gender: 'M',
  profile_img_url: null,
}
