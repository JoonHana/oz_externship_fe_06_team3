import { WITHDRAW_REASON_MAP } from '@/constants/withdrawReason'
import { z } from 'zod'
import { AUTH_MESSAGES } from '@/constants/authMessages'
import { PASSWORD_REGEX } from '@/schemas/auth'
import { normalizePhone } from '@/utils/normalize'

// 아이디 찾기 스키마
export const findIdSchema = z.object({
  name: z.string().trim().min(1, '이름을 입력해주세요.'),
  phone: z
    .string()
    .trim()
    .min(1, '휴대전화번호를 입력해주세요.')
    .regex(/^[0-9-]+$/, '숫자와 하이픈(-)만 입력 가능합니다.')
    .refine(
      (val) => normalizePhone(val).length >= 10,
      '휴대전화번호는 10~11자리로 입력해주세요.'
    ),
  verificationCode: z
    .string()
    .trim()
    .min(1, '인증번호를 입력해주세요.')
    .regex(/^\d{6}$/, '인증번호는 6자리 숫자로 입력해주세요.'),
})

export type FindIdFormData = z.infer<typeof findIdSchema>

// 비밀번호 찾기 스키마
export const findPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, '이메일을 입력해주세요.')
    .email('올바른 이메일 형식이 아닙니다.'),
  verificationCode: z
    .string()
    .trim()
    .min(1, '인증코드를 입력해주세요.')
    .regex(/^[0-9A-Za-z]+$/, '인증코드는 영문과 숫자만 입력 가능합니다.'),
})

export type FindPasswordFormData = z.infer<typeof findPasswordSchema>

// 비밀번호 재설정 스키마
export const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(1, '비밀번호를 입력해주세요.')
      .regex(PASSWORD_REGEX, AUTH_MESSAGES.password.formatHint),
    confirmPassword: z.string().min(1, '비밀번호 확인을 입력해주세요.'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: '비밀번호가 일치하지 않습니다.',
    path: ['confirmPassword'],
  })

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

// 계정 복구 스키마
export const restoreAccountSchema = z.object({
  email: z
    .string()
    .min(1, '이메일을 입력해주세요.')
    .email('올바른 이메일 형식이 아닙니다.'),
  verificationCode: z.string().min(1, '인증번호를 입력해주세요.'),
})

export type RestoreAccountFormData = z.infer<typeof restoreAccountSchema>

// 수강생 등록 스키마
export const registerStudentSchema = z.object({
  course: z.string().min(1, '과정을 선택해주세요.'),
  batch: z.string().min(1, '기수를 선택해주세요.'),
})

export type RegisterStudentFormData = z.infer<typeof registerStudentSchema>

// 회원 탈퇴 사유 스키마
export const withdrawalReasonSchema = z.object({
  reason: z
    .enum(
      Object.keys(WITHDRAW_REASON_MAP) as [
        keyof typeof WITHDRAW_REASON_MAP,
        ...(keyof typeof WITHDRAW_REASON_MAP)[],
      ]
    )
    .refine((val) => !!val, {
      message: '탈퇴 사유를 선택해주세요.',
    }),
  otherReason: z.string().optional(),
  feedback: z.string().optional(),
})

export type WithdrawalReasonFormData = z.infer<typeof withdrawalReasonSchema>

// 쪽지시험 시작 스키마
export const startQuizSchema = z.object({
  code: z
    .string()
    .min(1, '참가 코드를 입력해주세요.')
    .regex(/^[A-Za-z0-9]+$/, '영문과 숫자만 입력 가능합니다.'),
})

export type StartQuizFormData = z.infer<typeof startQuizSchema>
