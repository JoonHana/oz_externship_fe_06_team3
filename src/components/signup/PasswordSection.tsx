// 회원가입 비밀번호 섹션 - 비밀번호 + 확인 입력
import { Check } from 'lucide-react'

import { AUTH_MESSAGES } from '@/constants/authMessages'
import { SectionBlock } from '@/components/signup/SectionBlock'
import { PasswordField } from '@/components/common/PasswordField'
import { CommonInputField } from '@/components/common/CommonInputField'
import type { FieldState } from '@/components/common/CommonInput'
import type { SignupFormData } from '@/schemas/auth'

export type PasswordSectionProps = {
  passwordFieldState: FieldState
  passwordConfirmState: FieldState
  passwordConfirmMsg: string | null
}

export function PasswordSection({
  passwordFieldState,
  passwordConfirmState,
  passwordConfirmMsg,
}: PasswordSectionProps) {
  const isConfirmSuccess = passwordConfirmState === 'success'

  return (
    <SectionBlock
      label="비밀번호"
      rightText={
        <p className="text-primary text-left text-[14px] leading-[19.6px] font-semibold tracking-[-0.42px]">
          6~15자의 영문/숫자/특수문자 포함
        </p>
      }
    >
      <PasswordField<SignupFormData>
        name="password"
        placeholder="비밀번호를 입력해주세요"
        width="100%"
        placeholderVariant="a"
        state={passwordFieldState}
        showDefaultHelper
        helperVisibility="focus"
        helperTextByState={{
          success: AUTH_MESSAGES.password.available,
        }}
      />

      <CommonInputField<SignupFormData>
        name="passwordConfirm"
        type="password"
        placeholder="비밀번호를 다시 입력해주세요"
        width="100%"
        placeholderVariant="a"
        state={passwordConfirmState}
        stateOverride={isConfirmSuccess ? 'success' : undefined}
        helperVisibility="always"
        helperText={passwordConfirmMsg ?? undefined}
        rightSlot={
          isConfirmSuccess ? <Check className="text-success h-5 w-5" /> : null
        }
      />
    </SectionBlock>
  )
}
