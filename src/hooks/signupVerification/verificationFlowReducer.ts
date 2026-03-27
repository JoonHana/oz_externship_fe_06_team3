// 회원가입 인증 상태 reducer (SEND_SUCCESS, VERIFY_SUCCESS 등 액션 처리)
import { type FlowMessage, IDLE_FLOW_MESSAGE } from '@/utils/formMessage'
import {
  INITIAL_VERIFICATION_STATE,
  SEND_MODE,
  type SendMode,
  type VerificationStatus,
} from './verificationFlowConstants'

export type VerificationState = {
  token: string | null
  verified: boolean
  codeSent: boolean
  sendStatus: VerificationStatus
  flowMessage: FlowMessage
  verifyStatus: VerificationStatus
}

export type VerificationAction =
  | { type: 'IDENTITY_CHANGED' }
  | { type: 'RESET_VERIFY_STATE' }
  | { type: 'SEND_REQUEST' }
  | {
      type: 'SEND_SUCCESS'
      payload: { mode: SendMode; sent: string; resent: string }
    }
  | { type: 'SEND_FAILURE'; payload: { message: string } }
  | { type: 'VERIFY_REQUEST' }
  | { type: 'VERIFY_SUCCESS'; payload: { token: string; message: string } }
  | { type: 'VERIFY_FAILURE'; payload: { message: string } }
  | { type: 'EXPIRED'; payload: { message: string } }

function getSendSuccessMessage(
  mode: SendMode,
  sent: string,
  resent: string
): string {
  return mode === SEND_MODE.RESEND ? resent : sent
}

export function verificationReducer(
  state: VerificationState,
  action: VerificationAction
): VerificationState {
  switch (action.type) {
    case 'IDENTITY_CHANGED':
      return { ...INITIAL_VERIFICATION_STATE }

    case 'RESET_VERIFY_STATE':
      return {
        ...state,
        verified: false,
        token: null,
        verifyStatus: 'idle',
        flowMessage: IDLE_FLOW_MESSAGE,
      }

    case 'SEND_REQUEST':
      return {
        ...state,
        sendStatus: 'pending',
        flowMessage: IDLE_FLOW_MESSAGE,
      }

    case 'SEND_SUCCESS': {
      const message = getSendSuccessMessage(
        action.payload.mode,
        action.payload.sent,
        action.payload.resent
      )
      return {
        ...state,
        sendStatus: 'success',
        flowMessage: { type: 'success', message, scope: 'send' },
        codeSent: true,
      }
    }

    case 'SEND_FAILURE':
      return {
        ...state,
        sendStatus: 'error',
        flowMessage: {
          type: 'error',
          message: action.payload.message,
          scope: 'send',
        },
      }

    case 'VERIFY_REQUEST':
      return {
        ...state,
        verifyStatus: 'pending',
        flowMessage: IDLE_FLOW_MESSAGE,
      }

    case 'VERIFY_SUCCESS':
      return {
        ...state,
        token: action.payload.token,
        verified: true,
        verifyStatus: 'success',
        flowMessage: {
          type: 'success',
          message: action.payload.message,
          scope: 'verify',
        },
      }

    case 'VERIFY_FAILURE':
    case 'EXPIRED':
      return {
        ...state,
        verified: false,
        token: null,
        verifyStatus: 'error',
        flowMessage: {
          type: 'error',
          message: action.payload.message,
          scope: action.type === 'EXPIRED' ? 'expired' : 'verify',
        },
      }

    default:
      return state
  }
}
