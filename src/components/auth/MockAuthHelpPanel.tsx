import { useState } from 'react'
import { useLocation } from 'react-router-dom'

import {
  MOCK_EMAIL_VERIFICATION_CODE,
  MOCK_LOGIN_CREDENTIALS,
  MOCK_SMS_VERIFICATION_CODE,
} from '@/constants/mockAuth'

const MOCK_HELP_ROUTES = new Set(['/login', '/signup', '/signup/email'])

export default function MockAuthHelpPanel() {
  const { pathname } = useLocation()
  const isMockMode = import.meta.env.VITE_USE_MSW === 'true'
  const [isOpen, setIsOpen] = useState(true)

  if (!isMockMode || !MOCK_HELP_ROUTES.has(pathname)) {
    return null
  }

  return (
    <aside className="fixed right-4 bottom-4 left-4 z-40 sm:right-auto sm:left-6 sm:w-[336px]">
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
                <p className="text-mono-600 text-xs">
                  아래 정보로 로그인하거나 회원가입 인증을 진행할 수 있습니다.
                </p>
              </div>

              <div className="border-t border-gray-200 pt-3">
                <p className="text-foreground text-sm font-semibold">로그인</p>
                <dl className="mt-2 grid grid-cols-[72px_1fr] gap-x-2 gap-y-1 text-xs">
                  <dt className="text-mono-600">이메일</dt>
                  <dd className="font-mono text-[12px]">
                    {MOCK_LOGIN_CREDENTIALS.email}
                  </dd>
                  <dt className="text-mono-600">비밀번호</dt>
                  <dd className="font-mono text-[12px]">
                    {MOCK_LOGIN_CREDENTIALS.password}
                  </dd>
                </dl>
              </div>

              <div className="border-t border-gray-200 pt-3">
                <p className="text-foreground text-sm font-semibold">
                  회원가입 인증코드
                </p>
                <dl className="mt-2 grid grid-cols-[72px_1fr] gap-x-2 gap-y-1 text-xs">
                  <dt className="text-mono-600">이메일 코드</dt>
                  <dd className="font-mono text-[12px]">
                    {MOCK_EMAIL_VERIFICATION_CODE}
                  </dd>
                  <dt className="text-mono-600">문자 코드</dt>
                  <dd className="font-mono text-[12px]">
                    {MOCK_SMS_VERIFICATION_CODE}
                  </dd>
                </dl>
              </div>

              <p className="text-mono-600 text-[11px] leading-4">
                회원가입 입력값은 자유롭게 작성하고, 인증 단계에서는 위 고정 코드를 사용하면 됩니다.
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </aside>
  )
}
