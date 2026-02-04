import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/common/Button'
import { CommonInputField } from '@/components/common/CommonInputField'
import Dropdown from '@/components/common/Dropdown'
import { Modal } from '@/components/common/Modal'
import {
  withdrawalReasonSchema,
  type WithdrawalReasonFormData,
} from '@/schemas/modalSchemas'

interface WithdrawalReasonModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (data: WithdrawalReasonFormData) => void
}

// 탈퇴 사유 목록 목데이터
const withdrawalReasons = [
  { label: '서비스 이용 불편', value: 'inconvenience' },
  { label: '콘텐츠 부족', value: 'lack_of_content' },
  { label: '다른 서비스 이용', value: 'other_service' },
  { label: '개인정보 보호 우려', value: 'privacy' },
  { label: '기타', value: 'other' },
]

export function WithdrawalReasonModal({
  isOpen,
  onClose,
  onSuccess,
}: WithdrawalReasonModalProps) {
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null)
  const navigate = useNavigate()
  const logout = useAuthStore((state) => state.logout)

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current)
      }
    }
  }, [])

  // 탈퇴 사유 모달 닫힐 때 타이머 정리
  useEffect(() => {
    if (!isOpen && toastTimerRef.current) {
      clearTimeout(toastTimerRef.current)
      toastTimerRef.current = null
    }
  }, [isOpen])

  // 탈퇴 사유 모달 스키마 검증 메서드
  const methods = useForm<WithdrawalReasonFormData>({
    resolver: zodResolver(withdrawalReasonSchema),
    defaultValues: {
      reason: undefined,
      otherReason: '',
      feedback: '',
    },
  })

  const reasonValue = methods.watch('reason')
  const isOtherSelected = reasonValue === 'other'
  const isFormValid =
    reasonValue && (!isOtherSelected || methods.watch('otherReason'))
  const isDropdownSelected = !!reasonValue

  const onSubmit = async (data: WithdrawalReasonFormData) => {
    if (onSuccess) {
      await onSuccess(data)
      logout()
      navigate('/login', { replace: true })
    }
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current)
    }
    toastTimerRef.current = setTimeout(() => {
      onClose()
      toastTimerRef.current = null
    }, 1000)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="min-h-[537px] max-w-[646px]"
      toastPosition="top-far"
    >
      <Modal.Header>
        <div className="flex w-full flex-col items-center gap-2">
          <div className="flex w-full flex-col items-start gap-2">
            <h2 className="title-l">
              오즈코딩스쿨을 탈퇴하시는 이유는 무엇인가요?
            </h2>
          </div>
        </div>
      </Modal.Header>

      <Modal.Body>
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-4">
            <p
              className="mb-10"
              style={{
                fontSize: '16px',
                fontWeight: 'normal',
                color: '#BDBDBD',
              }}
            >
              계정을 삭제하시면 회원님의 모든 콘텐츠와 활동 기록, 수강 기간 /
              포인트 / 쿠폰 내역이 사라지며 환불되지 않습니다. 삭제된 정보는
              복구할 수 없습니다.
            </p>
            <Dropdown
              options={withdrawalReasons}
              value={reasonValue}
              onChange={(value) => {
                methods.setValue(
                  'reason',
                  value as WithdrawalReasonFormData['reason']
                )
                if (value !== 'other') {
                  methods.setValue('otherReason', '')
                }
              }}
              placeholder="탈퇴 사유를 선택해주세요"
            />
            {methods.formState.errors.reason && (
              <p className="mt-1 text-sm text-red-500">
                {methods.formState.errors.reason.message}
              </p>
            )}

            {isOtherSelected && (
              <Modal.InputRow label="기타 의견">
                <CommonInputField<WithdrawalReasonFormData>
                  name="otherReason"
                  placeholder="의견을 입력해주세요"
                  helperVisibility="always"
                  disabled={!isDropdownSelected}
                />
              </Modal.InputRow>
            )}

            {isDropdownSelected && (
              <>
                <p
                  className="mt-6 mb-4"
                  style={{
                    fontSize: '16px',
                    fontWeight: '400',
                    color: '#121212',
                  }}
                >
                  서비스를 이용하시면서 불편했 점이나 보완할 수 있는 방안을
                  알려주시면, 서비스 개선에 적극적으로 반영하겠습니다.
                  감사합니다!
                </p>
                <div className="mb-4">
                  <textarea
                    {...methods.register('feedback')}
                    placeholder="소중한 의견을 반영해 더 좋은 서비스를 위해 노력하겠습니다."
                    className="resize-none rounded-lg px-4 py-3 focus:border-violet-600 focus:ring-1 focus:ring-violet-600 focus:outline-none"
                    style={{
                      minWidth: '598px',
                      minHeight: '134px',
                      fontSize: '16px',
                      fontWeight: '400',
                      color: '#121212',
                      backgroundColor: '#FAFAFA',
                      borderColor: '#BDBDBD',
                      borderWidth: '1px',
                      borderStyle: 'solid',
                    }}
                  />
                </div>
                <div className="pt-4">
                  <Button
                    type="submit"
                    variant="primary"
                    size="xl"
                    className="w-full"
                    disabled={!isFormValid}
                  >
                    회원 탈퇴하기
                  </Button>
                </div>
              </>
            )}
          </form>
        </FormProvider>
      </Modal.Body>
    </Modal>
  )
}
