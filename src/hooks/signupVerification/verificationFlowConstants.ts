// 회원가입 인증용 상수 (send/verify 상태, 초기값 등)
import { IDLE_FLOW_MESSAGE } from '@/utils/formMessage'

export const VERIFICATION_STATUS = {
  IDLE: 'idle',
  PENDING: 'pending',
  ERROR: 'error',
  SUCCESS: 'success',
} as const

export type VerificationStatus =
  (typeof VERIFICATION_STATUS)[keyof typeof VERIFICATION_STATUS]

export const SEND_MODE = {
  FIRST: 'first',
  RESEND: 'resend',
} as const

export type SendMode = (typeof SEND_MODE)[keyof typeof SEND_MODE]

export const INITIAL_VERIFICATION_STATE = {
  token: null as string | null,
  verified: false,
  codeSent: false,
  sendStatus: VERIFICATION_STATUS.IDLE,
  flowMessage: IDLE_FLOW_MESSAGE,
  verifyStatus: VERIFICATION_STATUS.IDLE,
} as const

export const DEFAULT_ERROR_MESSAGES = {
  SEND_FAILED: '전송에 실패했습니다.',
  VERIFY_FAILED: '인증에 실패했습니다.',
} as const
