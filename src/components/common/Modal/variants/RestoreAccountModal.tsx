import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/common/Button'
import { CommonInputField } from '@/components/common/CommonInputField'
import { Modal } from '@/components/common/Modal'
import {
  restoreAccountSchema,
  type RestoreAccountFormData,
} from '@/schemas/modalSchemas'
import { useCountdown } from '@/hooks/useCountdown'
import cn from '@/lib/cn'

interface RestoreAccountModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (data: RestoreAccountFormData) => void
}

export function RestoreAccountModal({
  isOpen,
  onClose,
  onSuccess,
}: RestoreAccountModalProps) {
  const [isVerified, setIsVerified] = useState(false)
  const [verificationMessage, setVerificationMessage] = useState<string>('')
  const [showToast, setShowToast] = useState(false)
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [isCodeSent, setIsCodeSent] = useState(false)
  const [verificationError, setVerificationError] = useState<string>('')
  const [sentCode, setSentCode] = useState<string>('')
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const navigate = useNavigate()
  const { isExpired, isActive, startTimer, formatTime } = useCountdown(5)

  // 계정 복구 스키마 검증
  const methods = useForm<RestoreAccountFormData>({
    resolver: zodResolver(restoreAccountSchema),
    defaultValues: {
      email: '',
      verificationCode: '',
    },
  })

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current) //
      }
    }
  }, [])

  // 모달 닫힐 때 상태 초기화
  useEffect(() => {
    if (!isOpen) {
      setIsVerified(false)
      setVerificationMessage('')
      setShowToast(false)
      setShowSuccessToast(false)
      setIsCodeSent(false)
      setVerificationError('')
      methods.reset()
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [isOpen, methods])

  // 인증번호 전송 핸들러
  const handleSendCode = async () => {
    const isValid = await methods.trigger('email')
    if (!isValid) return

    // 인증번호 생성 , 여기서는 성공으로 가정, 실제로는 API 호출,목데이터는 123456 반환
    const mockCode = '123456'
    setSentCode(mockCode)

    // 인증번호 전송 로직
    startTimer()
    setShowToast(true)
    setIsCodeSent(true)
    setVerificationError('') // 에러 메시지 초기화
    setIsVerified(false) // 인증 상태 초기화
    setVerificationMessage('') // 인증 메시지 초기화
    setTimeout(() => setShowToast(false), 5000) // 5초 후 사라짐
  }

  // 인증번호 확인 핸들러
  const handleVerifyCode = async () => {
    if (isExpired) {
      methods.setError('verificationCode', {
        message: '인증 시간이 만료되었습니다. 다시 전송해주세요.',
      })
      setVerificationMessage('')
      setVerificationError('')
      return
    }

    const isValid = await methods.trigger('verificationCode')
    if (!isValid) {
      setVerificationMessage('')
      setVerificationError('')
      return
    }

    const verificationCode = methods.getValues('verificationCode')

    // 인증번호 확인 로직 , 여기서는 성공으로 가정, 실제로는 API 호출,목데이터는 123456 반환
    // 실패 시 인증코드가 일치하지 않습니다. 반환
    // 성공 시 인증번호가 확인되었습니다. 반환
    const codeIsValid = verificationCode === sentCode

    if (!codeIsValid) {
      setVerificationError('*인증코드가 일치하지 않습니다.')
      setVerificationMessage('')
      setIsVerified(false)
      methods.setError('verificationCode', {
        message: '인증코드가 일치하지 않습니다.',
      })
      return
    }

    setIsVerified(true)
    setVerificationMessage('인증번호가 확인되었습니다.')
    setVerificationError('')
    methods.clearErrors('verificationCode')
  }

  // 계정 복구 제출 핸들러
  const onSubmit = async (data: RestoreAccountFormData) => {
    if (!isVerified) {
      methods.setError('verificationCode', {
        message: '인증번호를 먼저 확인해주세요.',
      })
      return
    }

    setVerificationMessage('')
    onSuccess?.(data)
    setShowSuccessToast(true)

    // 5초 후 토스트 숨기고 로그인 페이지로 이동
    timerRef.current = setTimeout(() => {
      setShowSuccessToast(false)
      onClose()
      navigate('/')
      timerRef.current = null
    }, 5000)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      useBackdropV2={showSuccessToast}
      toastPosition={showSuccessToast ? 'center' : 'top-far'}
      toast={
        showSuccessToast ? (
          <div
            className="reset-password-toast flex flex-col items-center gap-3 overflow-hidden rounded-[12px] border border-gray-200 bg-white px-5 py-4 text-black shadow-lg"
            style={{
              minWidth: '396px',
              minHeight: '128px',
            }}
          >
            <div className="bg-success-500 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full">
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M11.6667 3.5L5.25 9.91667L2.33334 7"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="flex flex-col items-center gap-1">
              <p className="title-l-b text-center" style={{ color: '#121212' }}>
                계정 복구 완료!
              </p>
              <p className="subTitle-l text-center">지금 바로 로그인해보세요</p>
            </div>
          </div>
        ) : showToast ? (
          <div className="flex-center min-h-[60px] min-w-[270px] gap-3 rounded-lg border border-gray-200 bg-white px-5 py-4 text-black shadow-lg">
            <div className="bg-success-500 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full">
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M11.6667 3.5L5.25 9.91667L2.33334 7"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <p className="text-[14px] font-normal" style={{ color: '#4D4D4D' }}>
              전송 완료! 이메일을 확인해주세요.
            </p>
          </div>
        ) : undefined
      }
    >
      <Modal.Header>
        <div className="flex flex-col items-center gap-2">
          <img
            src="/icons/RestoreAccount.svg"
            alt="계정 다시 사용하기"
            style={{ width: '35px', height: '35px' }}
          />
          <h2 className="title-l-b">계정 다시 사용하기</h2>
          {!isCodeSent && (
            <p
              className="text-center font-normal"
              style={{
                fontSize: '14px',
                fontWeight: 'normal',
                color: '#4D4D4D',
              }}
            >
              입력하신 이메일로 인증번호를 보내드릴게요.
            </p>
          )}
        </div>
      </Modal.Header>

      <Modal.Body>
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-4">
            <Modal.InputRow label="이메일" required>
              <div className="flex flex-col gap-2">
                {/* 첫 번째 줄: 이메일 입력창 + 인증코드전송 버튼 */}
                <div className="flex gap-2">
                  <div
                    className="find-password-input"
                    style={{ minWidth: '250px' }}
                  >
                    <CommonInputField<RestoreAccountFormData>
                      name="email"
                      placeholder="이메일을 입력해주세요"
                      helperVisibility="always"
                      width={250}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSendCode}
                    disabled={isActive && !isExpired}
                    className={cn(
                      'h-[48px] w-[112px] rounded-[4px] border text-base text-black',
                      'transition-colors hover:bg-gray-200',
                      'disabled:cursor-not-allowed disabled:opacity-50'
                    )}
                    style={{
                      backgroundColor: '#ececec',
                      borderColor: '#bdbdbd',
                      borderWidth: '1px',
                    }}
                  >
                    인증코드전송
                  </button>
                </div>

                {/* 두 번째 줄: 인증번호 입력창 + 인증코드확인 버튼 */}
                <div className="flex gap-2">
                  <div
                    className="find-password-input"
                    style={{ minWidth: '250px' }}
                  >
                    <CommonInputField<RestoreAccountFormData>
                      name="verificationCode"
                      placeholder="인증번호 6자리를 입력해주세요"
                      helperVisibility="always"
                      width={250}
                      rightSlot={
                        isActive && !isExpired ? (
                          <span className="text-error text-sm font-medium">
                            {formatTime}
                          </span>
                        ) : undefined
                      }
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleVerifyCode}
                    disabled={isExpired || isVerified}
                    className={cn(
                      'h-[48px] w-[112px] rounded-[4px] border text-base text-black',
                      'transition-colors hover:bg-gray-200',
                      'disabled:cursor-not-allowed disabled:opacity-50'
                    )}
                    style={{
                      backgroundColor: '#ececec',
                      borderColor: '#bdbdbd',
                      borderWidth: '1px',
                    }}
                  >
                    인증코드확인
                  </button>
                </div>

                {/* 인증번호 확인 메시지 */}
                {verificationMessage && (
                  <p className="text-success mt-2 text-sm font-medium">
                    {verificationMessage}
                  </p>
                )}

                {/* 인증코드 에러 메시지 */}
                {verificationError && (
                  <p
                    className="mt-2 text-left text-[12px] font-normal"
                    style={{ color: '#EC0037' }}
                  >
                    {verificationError}
                  </p>
                )}
              </div>
            </Modal.InputRow>

            <div className="pt-4">
              <Button
                type="submit"
                variant="primary"
                size="xl"
                className="w-full"
                style={{ minWidth: '348px' }}
                disabled={!isVerified}
              >
                확인
              </Button>
            </div>
          </form>
        </FormProvider>
      </Modal.Body>
    </Modal>
  )
}
