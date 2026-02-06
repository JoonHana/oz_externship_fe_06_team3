import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
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
import { QUIZ_LIST_PATH, getQuizVerifiedKey } from '@/constants/quiz'
import type { ExamDeploymentDetailResult } from '@/mappers/examDeploymentDetail'

type Question = ExamDeploymentDetailResult['questions'][0]

/** 열린 모달: cheating=부정행위 안내(1차·2차 경고 → 3차 시 종료), fullscreen=전체화면 해제 안내, submitComplete=제출 완료 */
type OpenModal = 'cheating' | 'fullscreen' | 'submitComplete'

const ARRAY_ANSWER_TYPES = new Set<Question['type']>([
  'multiple_choice',
  'fill_blank',
  'ordering',
])

const CHEATING_DEBOUNCE_MS = 800
const INITIAL_REMAINING_SECONDS = 30 * 60
const STATUS_END_AUTO_NAVIGATE_MS = 5000

// 문제풀이 후 "제출하기"로 답안 제출 → 자동 채점 → 결과 페이지 이동
// 시간 초과 시: 푼 문항 제출, 미응답 0점 처리, 목록 응시완료 반영

function QuizPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { deploymentId } = useParams<{ deploymentId: string }>()
  const deploymentIdNumber = deploymentId ? Number(deploymentId) : 0
  const [isAccessAllowed, setIsAccessAllowed] = useState<boolean | null>(null)
  const [isEnded, setIsEnded] = useState(false)
  const [endReason, setEndReason] = useState<
    'time' | 'status' | 'cheating' | null
  >(null)
  const [remainingSeconds, setRemainingSeconds] = useState(INITIAL_REMAINING_SECONDS)
  const [cheatingCount, setCheatingCount] = useState(0)
  const [openModal, setOpenModal] = useState<OpenModal | null>(null)
  const [submittedSubmissionId, setSubmittedSubmissionId] = useState<
    number | null
  >(null)
  const lastCheatingAtRef = useRef(0)
  const hasInitializedTimerFromApi = useRef(false)
  const hasAutoSubmittedRef = useRef(false)
  const submittedSubmissionIdRef = useRef<number | null>(null)
  const submitAndEndByTimeRef = useRef<() => void>(() => {})

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

  // —— 답안 & 문제 렌더링 ——
  const handleAnswerChange = (questionId: number, answer: string | string[]) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }))
  }

  const renderQuestion = (question: Question) => {
    const answer = answers[question.questionId] ?? null
    const commonProps = { question, onAnswerChange: handleAnswerChange }
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

  // —— 부정행위 감지 ——
  const handleCheatingDetected = () => {
    if (isEnded) return
    const now = Date.now()
    if (now - lastCheatingAtRef.current < CHEATING_DEBOUNCE_MS) return
    lastCheatingAtRef.current = now
    setCheatingCount((prev) => Math.min(prev + 1, 3))
    setOpenModal('cheating')
  }

  const handleCheatingClose = () => setOpenModal(null)

  // —— 공통: 전체화면 해제, 제출 성공 반영, 결과/목록 이동 ——
  const exitFullscreenIfActive = async () => {
    if (!document.fullscreenElement) return
    try {
      await document.exitFullscreen()
    } catch {
      // ignore
    }
  }

  const applySubmitSuccess = (result: { submissionId: number }) => {
    setSubmittedSubmissionId(result.submissionId)
    submittedSubmissionIdRef.current = result.submissionId
    queryClient.invalidateQueries({ queryKey: ['examDeployments'] })
  }

  const navigateToResultOrList = (submissionId: number | null) => {
    exitFullscreenIfActive().then(() =>
      navigate(
        submissionId != null ? `/quiz/result/${submissionId}` : QUIZ_LIST_PATH
      )
    )
  }

  const clearVerificationAndNavigate = (submissionId: number | null) => {
    sessionStorage.removeItem(getQuizVerifiedKey(deploymentIdNumber))
    navigateToResultOrList(submissionId)
  }

  // 푼 문항은 제출값, 미응답은 '' 또는 []로 제출(서버에서 0점 처리)
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

  // 3회 부정행위 감지 시: 시험 종료 처리 후 현재 답안 자동 제출 → 결과 페이지 이동
  const handleCheatingTerminate = () => {
    setOpenModal(null)
    setIsEnded(true)
    setEndReason('cheating')
    const payload = buildSubmitPayload()
    if (!payload) {
      clearVerificationAndNavigate(null)
      return
    }
    submissionMutation.mutate(payload, {
      onSuccess: (result) => {
        applySubmitSuccess(result)
        clearVerificationAndNavigate(result.submissionId)
      },
      onError: () => {
        queryClient.invalidateQueries({ queryKey: ['examDeployments'] })
        clearVerificationAndNavigate(null)
      },
    })
  }

  const handleSubmit = () => {
    const payload = buildSubmitPayload()
    if (!payload) return
    submissionMutation.mutate(payload, {
      onSuccess: (result) => {
        applySubmitSuccess(result)
        setOpenModal('submitComplete')
      },
    })
  }

  const handleSubmitCompleteConfirm = () => {
    const sid = submittedSubmissionId
    setOpenModal(null)
    setSubmittedSubmissionId(null)
    submittedSubmissionIdRef.current = null
    clearVerificationAndNavigate(sid)
  }

  const handleEndConfirm = () => {
    const sid = submittedSubmissionIdRef.current ?? submittedSubmissionId
    setSubmittedSubmissionId(null)
    submittedSubmissionIdRef.current = null
    clearVerificationAndNavigate(sid)
  }

  // —— 시간 종료 (버튼/실제 만료 공통) ——
  const endQuizByTime = () => {
    setRemainingSeconds(0)
    setIsEnded(true)
    setEndReason('time')
  }

  const submitAndEndByTime = () => {
    if (hasAutoSubmittedRef.current) return
    hasAutoSubmittedRef.current = true
    const payload = buildSubmitPayload()
    if (!payload) {
      endQuizByTime()
      return
    }
    submissionMutation.mutate(payload, {
      onSuccess: applySubmitSuccess,
      onError: () => {
        queryClient.invalidateQueries({ queryKey: ['examDeployments'] })
      },
    })
    endQuizByTime()
  }
  submitAndEndByTimeRef.current = submitAndEndByTime

  const handleTimeEndTest = () => submitAndEndByTime()
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

  // 참가코드 검증 없이 URL로 직접 접근 시 경고 팝업 후 목록으로 리다이렉트
  useEffect(() => {
    const hasValidDeployment =
      deploymentId && deploymentIdNumber > 0
    const isVerified =
      hasValidDeployment &&
      sessionStorage.getItem(getQuizVerifiedKey(deploymentIdNumber))

    if (!isVerified) {
      window.alert(
        '접근할 수 없습니다. 쪽지시험 목록에서 참가코드를 입력한 후 응시해 주세요.'
      )
      navigate(QUIZ_LIST_PATH, { replace: true })
      return
    }
    setIsAccessAllowed(true)
  }, [deploymentId, deploymentIdNumber, navigate])

  // —— 부수효과: 이벤트 리스너 & 타이머 ——
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

  useEffect(() => {
    if (!data || hasInitializedTimerFromApi.current || isEnded) return
    hasInitializedTimerFromApi.current = true
    const durationMinutes = data.durationTime
    const totalSeconds = durationMinutes * 60
    const elapsedSeconds = (data.elapsedTime ?? 0) * 60
    const remaining = Math.max(0, totalSeconds - elapsedSeconds)
    setRemainingSeconds(remaining > 0 ? remaining : totalSeconds)
  }, [data, isEnded])

  useEffect(() => {
    if (isEnded) return
    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          submitAndEndByTimeRef.current()
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
      clearVerificationAndNavigate(submittedSubmissionIdRef.current)
    }, STATUS_END_AUTO_NAVIGATE_MS)
    return () => window.clearTimeout(timer)
  }, [showQuizEndModal])

  const warningLevel = Math.min(
    Math.max(cheatingCount, 1),
    3
  ) as 1 | 2 | 3

  if (isAccessAllowed !== true || isLoading) {
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
            aria-label="시험 완료 처리, 작성한 문항 제출·미작성 0점 제출 후 결과 페이지 이동·목록 응시완료"
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
              <NotFound detail="표시할 문제가 없습니다." />
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
            aria-label="문제풀이 답안 제출 후 채점 결과 확인 페이지로 이동"
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

      {/* 시간 종료 모달: 자동 제출 후 확인 시 결과 페이지 또는 목록으로 */}
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
              {submittedSubmissionId != null &&
                ' 답안이 제출되었습니다. (풀지 못한 문항은 0점 처리됩니다)'}
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
            disabled={submissionMutation.isPending}
          >
            {submissionMutation.isPending ? '제출 중...' : '확인'}
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
