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

export const MOCK_EMAIL_VERIFICATION_CODE = 'ABCDE12345'
export const MOCK_SMS_VERIFICATION_CODE = '123456'

export const MOCK_FIND_ID_EXAMPLE = {
  name: MOCK_LOGIN_USER.name,
  phoneNumber: '010-1234-5678',
}

export const MOCK_FIND_PASSWORD_EXAMPLE = {
  email: MOCK_LOGIN_CREDENTIALS.email,
}

export const MOCK_RESTORE_ACCOUNT_CREDENTIALS: LoginPayload = {
  email: 'restore@example.com',
  password: 'Restore123!',
}

export const MOCK_SIGNUP_EXAMPLE = {
  name: '홍길동',
  birthdate: '20000101',
  nickname: '체험유저01',
  email: 'demo01@example.com',
  phoneNumber: '010-9876-5432',
}

export const MOCK_SOCIAL_LOGIN_TOAST_MESSAGE =
  '목 모드에서는 소셜 로그인을 지원하지 않습니다. 일반 로그인을 사용해주세요.'
