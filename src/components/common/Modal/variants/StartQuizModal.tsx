import { useState, useEffect } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/common/Button'
import { CommonInputField } from '@/components/common/CommonInputField'
import { Modal } from '@/components/common/Modal'
import { useCheckExamCodeMutation } from '@/hooks/useQuiz'
import { startQuizSchema, type StartQuizFormData } from '@/schemas/modalSchemas'
import { getQuizVerifiedKey } from '@/constants/quiz'
import { parseAxiosError, resolveMessage } from '@/utils/error/axiosErrorParser'

interface StartQuizModalProps {
  isOpen: boolean
  onClose: () => void
  deploymentId: number
  imageUrl: string
  subjectName: string
  quizName: string
  questionCount: number
  timeLimit: number
  onSuccess?: (data: StartQuizFormData) => void
}

export function StartQuizModal({
  isOpen,
  onClose,
  deploymentId,
  imageUrl,
  subjectName,
  quizName,
  questionCount,
  timeLimit,
  onSuccess,
}: StartQuizModalProps) {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imageError, setImageError] = useState(false)
  const checkCodeMutation = useCheckExamCodeMutation()

  const requestFullscreen = async (): Promise<boolean> => {
    if (document.fullscreenElement) return true
    const element = document.documentElement
    if (!element.requestFullscreen) return false
    try {
      await element.requestFullscreen()
      return true
    } catch {
      return false
    }
  }

  const exitFullscreenIfActive = async () => {
    if (!document.fullscreenElement) return
    try {
      await document.exitFullscreen()
    } catch {
      // ignore
    }
  }

  const methods = useForm<StartQuizFormData>({
    resolver: zodResolver(startQuizSchema),
    defaultValues: {
      code: '',
    },
  })

  useEffect(() => {
    if (!isOpen) {
      methods.reset()
      setIsSubmitting(false)
      setImageError(false)
    }
  }, [isOpen, methods])

  const onSubmit = async (data: StartQuizFormData) => {
    setIsSubmitting(true)
    // 사용자 클릭 직후에 먼저 전체화면을 시도해야 브라우저 정책에 막힐 확률이 낮다.
    const enteredFullscreen = await requestFullscreen()
    try {
      await checkCodeMutation.mutateAsync({
        deploymentId,
        code: data.code,
      })

      sessionStorage.setItem(getQuizVerifiedKey(deploymentId), '1')
      onSuccess?.(data)
      onClose()
      navigate(`/quiz/${deploymentId}`)
    } catch (error) {
      // 코드 검증 실패 시 목록 화면에서 전체화면이 유지되지 않도록 원복
      if (enteredFullscreen) {
        await exitFullscreenIfActive()
      }
      const parsed = parseAxiosError(error)
      const errorMessage = resolveMessage(
        parsed,
        {
          400: '*코드번호가 일치하지 않습니다.',
          401: '*인증이 필요합니다. 다시 로그인해주세요.',
          403: '*접근 권한이 없습니다.',
          404: '*시험 정보를 찾을 수 없습니다.',
          423: '*시험이 잠겨있습니다.',
        },
        '*코드번호가 일치하지 않습니다.'
      )
      methods.setError('code', {
        type: 'manual',
        message: errorMessage,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <Modal.Header>
        <div className="flex flex-col items-center gap-4">
          {!imageError && (
            <img
              src={imageUrl}
              alt={subjectName}
              className="h-16 w-16"
              onError={() => setImageError(true)}
            />
          )}
          <div className="flex flex-col items-center gap-2">
            <h2 className="text-center text-[18px] font-semibold text-foreground">
              {quizName}
            </h2>
            <p className="text-center">
              <span className="text-muted-dark text-[14px] font-normal">
                총 {questionCount}문항
              </span>{' '}
              ㆍ{' '}
              <span className="text-primary text-[14px] font-normal">
                제한시간 {timeLimit}분
              </span>
            </p>
          </div>
        </div>
      </Modal.Header>

      <Modal.Body>
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-4">
            <Modal.InputRow label="참가 코드입력">
              <div className="min-w-[348px]">
                <CommonInputField<StartQuizFormData>
                  name="code"
                  placeholder="참가 코드를 입력해주세요"
                  helperVisibility="always"
                  state={methods.formState.errors.code ? 'error' : 'default'}
                  helperTextByState={{
                    error: (
                      <span className="text-error text-[12px] font-normal">
                        {methods.formState.errors.code?.message}
                      </span>
                    ),
                  }}
                />
              </div>
            </Modal.InputRow>

            <div className="pt-4">
              <Button
                type="submit"
                variant="primary"
                size="xl"
                className="w-full"
                style={{ minWidth: '348px' }}
                disabled={isSubmitting}
              >
                {isSubmitting ? '검증 중...' : '시험시작'}
              </Button>
            </div>
          </form>
        </FormProvider>
      </Modal.Body>
    </Modal>
  )
}
