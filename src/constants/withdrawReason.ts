export const WITHDRAW_REASON_MAP = {
  inconvenience: 'SERVICE_DISSATISFACTION',
  lack_of_content: 'NO_LONGER_NEEDED',
  other_service: 'TRANSFER',
  privacy: 'PRIVACY_CONCERN',
  other: 'OTHER',
} as const

export type WithdrawReasonKey = keyof typeof WITHDRAW_REASON_MAP
