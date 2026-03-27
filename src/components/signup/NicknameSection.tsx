// 회원가입 닉네임 섹션 - 입력 + 중복확인 버튼
import { Check } from 'lucide-react'

import { ActionRow } from '@/components/signup/ActionRow'
import { SectionBlock } from '@/components/signup/SectionBlock'
import { Button } from '@/components/common/Button'
import { CommonInputField } from '@/components/common/CommonInputField'
import type { FieldState } from '@/components/common/CommonInput'
import type { SignupFormData } from '@/schemas/auth'
import type { FlowMessage } from '@/utils/formMessage'
import {
  getVerificationButtonProps,
  renderFlowMessage,
} from './utils'

export type NicknameSectionProps = {
  nicknameFieldState: FieldState
  flowMessage: FlowMessage
  nicknameChecked: boolean
  nickname: string
  canCheckNickname: boolean
  busy: boolean
  onCheckNickname: () => void
}

export function NicknameSection({
  nicknameFieldState,
  flowMessage,
  nicknameChecked,
  canCheckNickname,
  onCheckNickname,
}: NicknameSectionProps) {
  const duplicateCheckButtonProps = getVerificationButtonProps(canCheckNickname)
  const flowMessageDisplay = renderFlowMessage(flowMessage)

  return (
    <SectionBlock label="닉네임">
      <ActionRow
        left={
          <CommonInputField<SignupFormData>
            name="nickname"
            type="text"
            placeholder="닉네임을 입력해주세요"
            width="100%"
            placeholderVariant="a"
            state={nicknameFieldState}
            helperVisibility="always"
            rightSlot={
              nicknameChecked ? (
                <Check className="text-success h-5 w-5" />
              ) : undefined
            }
          />
        }
        right={
          <Button
            type="button"
            size="sm"
            variant={duplicateCheckButtonProps.variant}
            disabled={duplicateCheckButtonProps.disabled}
            className="whitespace-nowrap"
            onClick={onCheckNickname}
          >
            {nicknameChecked ? '확인완료' : '중복확인'}
          </Button>
        }
        below={flowMessageDisplay}
      />
    </SectionBlock>
  )
}
