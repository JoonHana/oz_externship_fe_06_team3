import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { toast } from 'react-hot-toast'

import {
  MOCK_EMAIL_VERIFICATION_CODE,
  MOCK_LOGIN_CREDENTIALS,
  MOCK_SMS_VERIFICATION_CODE,
} from '@/constants/mockAuth'

const MOCK_HELP_ROUTES = new Set(['/login', '/signup', '/signup/email'])
const MOCK_QUIZ_ROUTE = '/mypage/quiz'

export default function MockAuthHelpPanel() {
  const { pathname } = useLocation()
  const isMockMode = import.meta.env.VITE_USE_MSW === 'true'
  const [isOpen, setIsOpen] = useState(true)
  const isAuthHelpRoute = MOCK_HELP_ROUTES.has(pathname)
  const isQuizHelpRoute = pathname === MOCK_QUIZ_ROUTE

  const handleCopy = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      toast.success(`${label} 복사됨`, { duration: 1800 })
    } catch {
      toast.error('복사에 실패했습니다.')
    }
  }

  if (!isMockMode || (!isAuthHelpRoute && !isQuizHelpRoute)) {
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
              {isAuthHelpRoute ? (
                <>
                  <div>
                    <p className="text-mono-600 text-xs">
                      아래 정보로 로그인하거나 회원가입 인증을 진행할 수 있습니다.
                    </p>
                  </div>

                  <div className="border-t border-gray-200 pt-3">
                    <p className="text-foreground text-sm font-semibold">로그인</p>
                    <dl className="mt-2 grid grid-cols-[72px_1fr_auto] items-center gap-x-2 gap-y-2 text-xs">
                      <div className="contents">
                        <dt className="text-mono-600">이메일</dt>
                        <dd className="font-mono text-[12px]">
                          {MOCK_LOGIN_CREDENTIALS.email}
                        </dd>
                        <button
                          type="button"
                          className="cursor-pointer rounded border border-gray-200 px-2 py-1 text-[11px] font-medium text-gray-600 transition-colors hover:bg-gray-50"
                          onClick={() =>
                            void handleCopy('이메일', MOCK_LOGIN_CREDENTIALS.email)
                          }
                        >
                          복사
                        </button>
                      </div>
                      <div className="contents">
                        <dt className="text-mono-600">비밀번호</dt>
                        <dd className="font-mono text-[12px]">
                          {MOCK_LOGIN_CREDENTIALS.password}
                        </dd>
                        <button
                          type="button"
                          className="cursor-pointer rounded border border-gray-200 px-2 py-1 text-[11px] font-medium text-gray-600 transition-colors hover:bg-gray-50"
                          onClick={() =>
                            void handleCopy('비밀번호', MOCK_LOGIN_CREDENTIALS.password)
                          }
                        >
                          복사
                        </button>
                      </div>
                    </dl>
                    <p className="text-mono-600 mt-2 text-[11px] leading-4">
                      복사 버튼을 사용하면 공백 없이 입력됩니다.
                    </p>
                  </div>

                  <div className="border-t border-gray-200 pt-3">
                    <p className="text-foreground text-sm font-semibold">
                      회원가입 인증코드
                    </p>
                    <dl className="mt-2 grid grid-cols-[72px_1fr_auto] items-center gap-x-2 gap-y-2 text-xs">
                      <div className="contents">
                        <dt className="text-mono-600">이메일 코드</dt>
                        <dd className="font-mono text-[12px]">
                          {MOCK_EMAIL_VERIFICATION_CODE}
                        </dd>
                        <button
                          type="button"
                          className="cursor-pointer rounded border border-gray-200 px-2 py-1 text-[11px] font-medium text-gray-600 transition-colors hover:bg-gray-50"
                          onClick={() =>
                            void handleCopy('이메일 코드', MOCK_EMAIL_VERIFICATION_CODE)
                          }
                        >
                          복사
                        </button>
                      </div>
                      <div className="contents">
                        <dt className="text-mono-600">문자 코드</dt>
                        <dd className="font-mono text-[12px]">
                          {MOCK_SMS_VERIFICATION_CODE}
                        </dd>
                        <button
                          type="button"
                          className="cursor-pointer rounded border border-gray-200 px-2 py-1 text-[11px] font-medium text-gray-600 transition-colors hover:bg-gray-50"
                          onClick={() =>
                            void handleCopy('문자 코드', MOCK_SMS_VERIFICATION_CODE)
                          }
                        >
                          복사
                        </button>
                      </div>
                    </dl>
                    <p className="text-mono-600 mt-2 text-[11px] leading-4">
                      인증 단계에서는 복사 버튼으로 정확한 코드를 붙여넣으면 됩니다.
                    </p>
                  </div>
                </>
              ) : null}

              {isQuizHelpRoute ? (
                <>
                  <div>
                    <p className="text-mono-600 text-xs">
                      아래 정보로 쪽지시험 응시를 진행할 수 있습니다.
                    </p>
                    <p className="text-mono-600 text-[12px] leading-4 my-2">
                      현재 Mock 체험은 마이페이지 중 '쪽지시험' 부분만 가능합니다.
                    </p>
                    <p className="text-error text-[12px] leading-4 my-2">
                      ※ 주의 : 드래그 하여 복사, 붙혀넣기를 할 경우 검증이 되지 않습니다. 직접
                      입력해주세요
                    </p>
                  </div>

                  <div className="border-t border-gray-200 mt-1 py-5">
                    <p className="text-foreground text-sm font-semibold">
                      쪽지 시험 응시하기
                    </p>
                    <dl className="mt-2 grid grid-cols-[72px_1fr] gap-x-2 gap-y-1 text-xs">
                      <dt className="text-mono-600">참가 코드</dt>
                      <dd className="font-mono text-[12px]">123456</dd>
                    </dl>
                  </div>

                  <div className="border-t border-gray-200 pt-1">

                  </div>
                </>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </aside>
  )
}
