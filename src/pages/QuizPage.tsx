import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Button,
  CheatingWarningModal,
  Loading,
  Modal,
  NotFound,
  QuizEndModal,
  QuizSubmitCompleteModal,
} from '@/components/common'
import QuizHeader from '@/components/quiz/QuizHeader'
import QuizWarningBox from '@/components/QuizWarningBox'
import {
  useExamDeploymentDetailQuery,
  useExamDeploymentStatusQuery,
  useExamSubmissionMutation,
} from '@/hooks/useQuiz'
import {
  SingleChoice,
  MultipleChoice,
  OX,
  FillBlank,
  Ordering,
  ShortAnswer,
} from '@/components/quiz'
import type { ExamDeploymentDetailResult } from '@/mappers/examDeploymentDetail'

type Question = ExamDeploymentDetailResult['questions'][0]

/** 열린 모달: cheating=부정행위 안내(1차·2차 경고 → 3차 시 종료), fullscreen=전체화면 해제 안내, submitComplete=제출 완료 */
type OpenModal = 'cheating' | 'fullscreen' | 'submitComplete'

const ARRAY_ANSWER_TYPES = new Set<Question['type']>([
  'multiple_choice',
  'fill_blank',
  'ordering',
])

function QuizPage() {
  const navigate = useNavigate()
  const { deploymentId } = useParams<{ deploymentId: string }>()
  const deploymentIdNumber = deploymentId ? Number(deploymentId) : 0
  const [isEnded, setIsEnded] = useState(false)
  const [endReason, setEndReason] = useState<
    'time' | 'status' | 'cheating' | null
  >(null)
  const [remainingSeconds, setRemainingSeconds] = useState(30 * 60)
  const [cheatingCount, setCheatingCount] = useState(0)
  const [openModal, setOpenModal] = useState<OpenModal | null>(null)
  const [submittedSubmissionId, setSubmittedSubmissionId] = useState<
    number | null
  >(null)
  const lastCheatingAtRef = useRef(0)
  const hasInitializedTimerFromApi = useRef(false)

  const submissionMutation = useExamSubmissionMutation()
  const { data, isLoading } = useExamDeploymentDetailQuery(
    deploymentIdNumber,
    !!deploymentId
  )
  const { data: statusData } = useExamDeploymentStatusQuery(
    deploymentIdNumber,
    !!deploymentId && !isEnded
  )
  const [answers, setAnswers] = useState<
    Record<number, string | string[] | null>
  >({})

  // 답변 변경 핸들러
  const handleAnswerChange = (questionId: number, answer: string | string[]) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }))
  }

  const renderQuestion = (question: Question) => {

    // 문제에 대한 답변 처리
    const answer = answers[question.questionId] ?? null
    // 문제에 대한 공통 속성 처리
    const commonProps = {
      question, // 문제 정보
      onAnswerChange: handleAnswerChange, // 답변 변경 핸들러
    }
    switch (question.type) {
      case 'single_choice':
        return <SingleChoice {...commonProps} answer={answer as string | null} />
      case 'multiple_choice':
        return (
          <MultipleChoice {...commonProps} answer={answer as string[] | null} />
        )
      case 'short_answer':
        return <ShortAnswer {...commonProps} answer={answer as string | null} />
      case 'ox':
        return <OX {...commonProps} answer={answer as string | null} />
      case 'fill_blank':
        return <FillBlank {...commonProps} answer={answer as string[] | null} />
      case 'ordering':
        return <Ordering {...commonProps} answer={answer as string[] | null} />
      default:
        return null
    }
  }

  const handleCheatingDetected = () => {
    if (isEnded) return
    const now = Date.now()
    if (now - lastCheatingAtRef.current < 800) return
    lastCheatingAtRef.current = now
    setCheatingCount((prev) => {
      const next = Math.min(prev + 1, 3)
      setOpenModal('cheating')
      return next
    })
  }

  const handleCheatingClose = () => setOpenModal(null)
  const handleCheatingTerminate = () => {
    setOpenModal(null)
    // TODO: 3회 부정행위 감지 시 자동 제출 및 결과 페이지 이동 처리 필요
  }

  const exitFullscreenIfActive = async () => {
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen()
      } catch {
        // ignore
      }
    }
  }

  const buildSubmitPayload = () => {
    if (!data?.questions) return null
    const answerList = data.questions.map((q) => {
      const raw = answers[q.questionId]
      const submitted_answer =
        raw != null ? raw : ARRAY_ANSWER_TYPES.has(q.type) ? [] : ''
      return { question_id: q.questionId, type: q.type, submitted_answer }
    })
    return {
      deployment_id: deploymentIdNumber,
      started_at: new Date().toISOString(),
      cheating_count: cheatingCount,
      answers: answerList,
    }
  }

  const handleSubmit = () => {
    const payload = buildSubmitPayload()
    if (!payload) return
    submissionMutation.mutate(payload, {
      onSuccess: (result) => {
        setSubmittedSubmissionId(result.submissionId)
        setOpenModal('submitComplete')
      },
    })
  }

  const handleSubmitCompleteConfirm = () => {
    setOpenModal(null)
    const sid = submittedSubmissionId
    setSubmittedSubmissionId(null)
    exitFullscreenIfActive().then(() => {
      navigate(sid !== null ? `/quiz/result/${sid}` : '/mypage/quiz')
    })
  }

  const handleEndConfirm = () => {
    exitFullscreenIfActive().then(() => navigate('/mypage/quiz'))
  }

  const handleTimeEndTest = () => {
    setRemainingSeconds(0)
    setIsEnded(true)
    setEndReason('time')
  }

  const handleStatusEndTest = () => {
    setIsEnded(true)
    setEndReason('status')
  }

  const handleFullscreenRetry = async () => {
    try {
      await document.documentElement.requestFullscreen()
      setOpenModal(null)
    } catch {
      // 전체화면 전환 실패 시 무시
    }
  }

  const handleCloseSubmitCompleteModal = () => setOpenModal(null)

  useEffect(() => {
    if (isEnded) return
    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleCheatingDetected()
      }
    }
    const handleWindowBlur = () => {
      handleCheatingDetected()
    }
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      handleCheatingDetected()
      event.preventDefault()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('blur', handleWindowBlur)
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('blur', handleWindowBlur)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [handleCheatingDetected, isEnded])

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (cheatingCount >= 3) return
      if (!document.fullscreenElement) {
        setOpenModal('fullscreen')
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.key === 'F11') {
        event.preventDefault()
        handleCheatingDetected()
      }
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleCheatingDetected, cheatingCount])

  // 문제 불러온 뒤 API의 duration_time, elapsed_time으로 타이머 초기화 (한 번만)
  useEffect(() => {
    if (!data || hasInitializedTimerFromApi.current || isEnded) return
    hasInitializedTimerFromApi.current = true
    const totalSeconds = data.durationTime * 60
    const elapsedSeconds = (data.elapsedTime ?? 0) * 60
    const remaining = Math.max(0, totalSeconds - elapsedSeconds)
    setRemainingSeconds(remaining)
    if (remaining <= 0) {
      setIsEnded(true)
      setEndReason('time')
    }
  }, [data, isEnded])

  useEffect(() => {
    if (isEnded) return
    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          setIsEnded(true)
          setEndReason('time')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isEnded])

  useEffect(() => {
    if (isEnded) return
    if (
      statusData?.examStatus === 'closed' ||
      statusData?.examStatus === 'private' ||
      statusData?.forceSubmit
    ) {
      setIsEnded(true)
      setEndReason('status')
    }
  }, [statusData, isEnded])

  const minutes = Math.floor(remainingSeconds / 60)
  const seconds = (remainingSeconds % 60).toString().padStart(2, '0')
  const formattedRemaining = `${minutes} : ${seconds}`
  const showTimeEndModal = isEnded && endReason === 'time'
  const showQuizEndModal = isEnded && endReason === 'status'

  useEffect(() => {
    if (!showQuizEndModal) return
    const timer = window.setTimeout(() => {
      exitFullscreenIfActive().then(() => navigate('/mypage/quiz'))
    }, 5000)
    return () => window.clearTimeout(timer)
  }, [showQuizEndModal])

  const warningLevel = Math.min(
    Math.max(cheatingCount, 1),
    3
  ) as 1 | 2 | 3

  if (isLoading) {
    return <Loading />
  }

  return (
    <div>
      <QuizHeader
        subjectName={data?.examName || '쪽지시험'}
        timeRemaining={formattedRemaining}
        timeRemainingSuffix="남음"
        cheatingCount={cheatingCount}
      />

      <main className="flex flex-col items-center px-10 py-6">
        <QuizWarningBox />
        <div className="mb-6 flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            rounded="default"
            onClick={handleTimeEndTest}
          >
            타이머 종료 테스트
          </Button>
          <Button
            variant="secondary"
            size="sm"
            rounded="default"
            onClick={handleStatusEndTest}
          >
            상태 종료 테스트
          </Button>
        </div>

        <div className="min-h-[500px] min-w-[1200px]">
          {data?.questions && data.questions.length > 0 ? (
            <div className="space-y-8">
              {data.questions.map((question) => (
                <div key={question.questionId}>{renderQuestion(question)}</div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center py-20">
              <NotFound detail="표시할 문제가 없습니다.." />
            </div>
          )}
        </div>
      </main>

      <footer>
        <div className="flex justify-center mb-10">
          <Button
            variant="primary"
            size="md"
            rounded="default"
            onClick={handleSubmit}
            disabled={submissionMutation.isPending}
          >
            {submissionMutation.isPending ? '제출 중...' : '제출하기'}
          </Button>
        </div>
      </footer>

      <CheatingWarningModal
        isOpen={openModal === 'cheating'}
        onClose={handleCheatingClose}
        warningLevel={warningLevel}
        onConfirm={handleCheatingClose}
        onTerminate={handleCheatingTerminate}
      />

      <Modal isOpen={openModal === 'fullscreen'} onClose={() => {}}>
        <Modal.Body>
          <div className="flex min-w-[250px] flex-col items-center gap-4 py-4">
            <p className="text-center text-[16px] text-foreground-secondary">
              전체화면이 해제되었습니다. <br />
              시험 진행을 위해 전체화면으로 돌아가 주세요.
            </p>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="primary"
            size="md"
            rounded="default"
            className="w-full"
            onClick={handleFullscreenRetry}
          >
            전체화면으로 돌아가기
          </Button>
        </Modal.Footer>
      </Modal>

      {/* 시간 종료 모달 */}
      <Modal isOpen={showTimeEndModal} onClose={handleEndConfirm}>
        <Modal.Body>
          <div className="flex min-w-[250px] flex-col items-center gap-6 py-4">
            <img
              src="/icons/cloud_404.svg"
              alt="시험 종료"
              className="h-[58px] w-[74px]"
            />
            <p className="text-center text-[16px] text-foreground-secondary">
              시험 시간이 종료되었습니다.
            </p>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="primary"
            size="md"
            rounded="default"
            className="w-full"
            onClick={handleEndConfirm}
          >
            확인
          </Button>
        </Modal.Footer>
      </Modal>

      {/* 관리자에 의한 종료 모달: 5초 후 쪽지시험 리스트로 자동 이동 */}
      <QuizEndModal
        isOpen={showQuizEndModal}
        onClose={handleEndConfirm}
        onConfirm={handleEndConfirm}
      />

      {/* 제출하기 완료 모달 */}
      <QuizSubmitCompleteModal
        isOpen={openModal === 'submitComplete'}
        onClose={handleCloseSubmitCompleteModal}
        onConfirm={handleSubmitCompleteConfirm}
      />
    </div>
  )
}

export default QuizPage
