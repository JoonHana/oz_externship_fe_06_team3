import { useState } from 'react'
import { toast } from 'react-hot-toast'

import {
  MOCK_EMAIL_VERIFICATION_CODE,
  MOCK_FIND_ID_EXAMPLE,
  MOCK_FIND_PASSWORD_EXAMPLE,
  MOCK_LOGIN_CREDENTIALS,
  MOCK_RESTORE_ACCOUNT_CREDENTIALS,
  MOCK_SMS_VERIFICATION_CODE,
} from '@/constants/mockAuth'

export type MockAuthHelpPanelVariant =
  | 'login'
  | 'signup'
  | 'find-id'
  | 'find-password'
  | 'restore-account'

type MockAuthHelpPanelProps = {
  variant: MockAuthHelpPanelVariant
}

type MockHelpField = {
  label: string
  value: string
  copyLabel?: string
}

type MockHelpSection = {
  title: string
  helper?: string
  fields: MockHelpField[]
}

type MockHelpPanelContent = {
  description: string
  sections: MockHelpSection[]
}

const MOCK_HELP_CONTENT: Record<MockAuthHelpPanelVariant, MockHelpPanelContent> =
  {
    login: {
      description: '아래 계정으로 일반 로그인을 진행할 수 있습니다.',
      sections: [
        {
          title: '로그인 정보',
          helper: '복사 버튼을 사용하면 공백 없이 입력됩니다.',
          fields: [
            { label: '이메일', value: MOCK_LOGIN_CREDENTIALS.email },
            { label: '비밀번호', value: MOCK_LOGIN_CREDENTIALS.password },
          ],
        },
      ],
    },
    signup: {
      description:
        '회원가입 인증은 먼저 전송 버튼을 누른 뒤 같은 이메일과 휴대전화로 확인해주세요.',
      sections: [
        {
          title: '회원가입 인증코드',
          helper: '이메일 코드와 문자 코드는 언제나 아래 고정값을 사용하면 됩니다.',
          fields: [
            {
              label: '이메일 코드',
              value: MOCK_EMAIL_VERIFICATION_CODE,
            },
            { label: '문자 코드', value: MOCK_SMS_VERIFICATION_CODE },
          ],
        },
      ],
    },
    'find-id': {
      description:
        '아이디 찾기는 아래 이름과 휴대전화로 인증번호를 요청한 뒤 같은 정보로 확인해주세요.',
      sections: [
        {
          title: '아이디 찾기 정보',
          helper: '문자 인증은 전송 후 같은 휴대전화 번호로 확인해야 합니다.',
          fields: [
            { label: '이름', value: MOCK_FIND_ID_EXAMPLE.name },
            {
              label: '휴대전화',
              value: MOCK_FIND_ID_EXAMPLE.phoneNumber,
            },
            { label: '문자 코드', value: MOCK_SMS_VERIFICATION_CODE },
          ],
        },
      ],
    },
    'find-password': {
      description:
        '비밀번호 찾기는 아래 이메일로 인증코드를 전송한 뒤 같은 이메일로 확인해주세요.',
      sections: [
        {
          title: '비밀번호 찾기 정보',
          helper: '이메일 인증은 전송 후 같은 이메일로 확인해야 합니다.',
          fields: [
            { label: '이메일', value: MOCK_FIND_PASSWORD_EXAMPLE.email },
            {
              label: '이메일 코드',
              value: MOCK_EMAIL_VERIFICATION_CODE,
            },
          ],
        },
      ],
    },
    'restore-account': {
      description:
        '탈퇴회원 복구 테스트는 아래 계정으로 로그인한 뒤 같은 이메일로 인증을 진행해주세요.',
      sections: [
        {
          title: '계정 복구 정보',
          helper: '복구 모달에서는 로그인 후 이메일 인증코드를 전송하고 같은 이메일로 확인합니다.',
          fields: [
            {
              label: '이메일',
              value: MOCK_RESTORE_ACCOUNT_CREDENTIALS.email,
            },
            {
              label: '비밀번호',
              value: MOCK_RESTORE_ACCOUNT_CREDENTIALS.password,
            },
            {
              label: '이메일 코드',
              value: MOCK_EMAIL_VERIFICATION_CODE,
            },
          ],
        },
      ],
    },
  }

export default function MockAuthHelpPanel({
  variant,
}: MockAuthHelpPanelProps) {
  const isMockMode = import.meta.env.VITE_USE_MSW === 'true'
  const [isOpen, setIsOpen] = useState(true)
  const content = MOCK_HELP_CONTENT[variant]

  const handleCopy = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      toast.success(`${label} 복사됨`, { duration: 1800 })
    } catch {
      toast.error('복사에 실패했습니다.')
    }
  }

  if (!isMockMode) {
    return null
  }

  return (
    <aside className="fixed right-4 bottom-4 left-4 z-[80] sm:right-auto sm:left-6 sm:w-[348px]">
      <div className="overflow-hidden border border-gray-200 bg-white/95 shadow-lg backdrop-blur">
        <button
          type="button"
          className="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-left"
          onClick={() => setIsOpen((current) => !current)}
        >
          <span className="text-foreground text-sm font-semibold">
            Mock 체험 안내
          </span>
          <span className="text-mono-600 text-xs">
            {isOpen ? '접기' : '열기'}
          </span>
        </button>

        {isOpen ? (
          <div className="border-t border-gray-200 p-4">
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-mono-600 text-xs">{content.description}</p>
              </div>

              {content.sections.map((section) => (
                <div key={section.title} className="border-t border-gray-200 pt-3">
                  <p className="text-foreground text-sm font-semibold">
                    {section.title}
                  </p>
                  <dl className="mt-2 grid grid-cols-[72px_1fr_auto] items-center gap-x-2 gap-y-2 text-xs">
                    {section.fields.map((field) => (
                      <div key={`${section.title}-${field.label}`} className="contents">
                        <dt className="text-mono-600">{field.label}</dt>
                        <dd className="font-mono text-[12px]">{field.value}</dd>
                        <button
                          type="button"
                          className="cursor-pointer rounded border border-gray-200 px-2 py-1 text-[11px] font-medium text-gray-600 transition-colors hover:bg-gray-50"
                          onClick={() =>
                            void handleCopy(field.copyLabel ?? field.label, field.value)
                          }
                        >
                          복사
                        </button>
                      </div>
                    ))}
                  </dl>
                  {section.helper ? (
                    <p className="text-mono-600 mt-2 text-[11px] leading-4">
                      {section.helper}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </aside>
  )
}
