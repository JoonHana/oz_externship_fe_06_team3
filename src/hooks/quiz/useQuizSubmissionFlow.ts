import { useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useExamSubmissionMutation } from '@/hooks/useQuiz'
import { QUIZ_LIST_PATH, getQuizVerifiedKey, ARRAY_ANSWER_TYPES } from '@/constants/quiz'
import type { ExamDeploymentDetailResult } from '@/mappers/examDeploymentDetail'
import type { QuizOpenModal } from './useCheatingDetection'

export type EndReason = 'time' | 'status' | 'cheating' | null

interface UseQuizSubmissionFlowParams {
  deploymentIdNumber: number
  data: ExamDeploymentDetailResult | undefined
  answers: Record<number, string | string[] | null>
  cheatingCount: number
  /** 응시 페이지 진입 후 타이머가 처음 시작된 시각 (ISO 문자열). 제출 시 started_at으로 전송 */
  quizStartedAt: string
  setOpenModal: (modal: QuizOpenModal | null) => void
  setIsEnded: (ended: boolean) => void
  setEndReason: (reason: EndReason) => void
  setRemainingSeconds: (seconds: number) => void
}

/**
 * 제출 mutation, 검증 제거·결과/목록 이동, 시간 종료 시 자동 제출 로직.
 */
export function useQuizSubmissionFlow({
  deploymentIdNumber,
  data,
  answers,
  cheatingCount,
  quizStartedAt,
  setOpenModal,
  setIsEnded,
  setEndReason,
  setRemainingSeconds,
}: UseQuizSubmissionFlowParams) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const submissionMutation = useExamSubmissionMutation()
  const [submittedSubmissionId, setSubmittedSubmissionId] = useState<number | null>(null)
  const submittedSubmissionIdRef = useRef<number | null>(null)
  const hasAutoSubmittedRef = useRef(false)

  const exitFullscreenIfActive = async () => {
    if (!document.fullscreenElement) return
    try {
      await document.exitFullscreen()
    } catch {
      // ignore
    }
  }

  // 결과 또는 목록 이동
  const navigateToResultOrList = (submissionId: number | null) => {
    exitFullscreenIfActive().then(() =>
      navigate(// submissionId가 null이 아니면 제출 결과 페이지로 이동, 아니면 목록 페이지로 이동
        submissionId != null ? `/quiz/result/${submissionId}` : QUIZ_LIST_PATH
      )
    )
  }

  // 검증 제거·결과/목록 이동
  const clearVerificationAndNavigate = (submissionId: number | null) => {
    sessionStorage.removeItem(getQuizVerifiedKey(deploymentIdNumber))
    navigateToResultOrList(submissionId)
  }

  // 제출 성공 처리
  const applySubmitSuccess = (result: { submissionId: number }) => {
    setSubmittedSubmissionId(result.submissionId)
    submittedSubmissionIdRef.current = result.submissionId
    queryClient.invalidateQueries({ queryKey: ['examDeployments'] })
  }

  // 제출 요청 데이터 생성
  const buildSubmitPayload = () => {
    if (!data?.questions) return null
    const answerList = data.questions.map((q) => {
      const raw = answers[q.questionId]
      const submitted_answer =
        raw != null
          ? raw
          : ARRAY_ANSWER_TYPES.has(
              q.type as 'multiple_choice' | 'fill_blank' | 'ordering'
            )
            ? []
            : ''
      return { question_id: q.questionId, type: q.type, submitted_answer }
      // 문제 ID, 문제 유형, 제출 답안 반환
    })
    return {
      deployment_id: deploymentIdNumber,
      started_at: quizStartedAt || new Date().toISOString(),
      cheating_count: cheatingCount,
      answers: answerList,
    }
  }

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

  // 부정행위 감지 시 시험 종료 처리
  const handleCheatingTerminate = () => {
    setOpenModal(null) // 모달 닫기
    setIsEnded(true) // 시험 종료 상태 true로 설정
    setEndReason('cheating') // 시험 종료 이유 'cheating'으로 설정
    const payload = buildSubmitPayload()
    if (!payload) { // 제출 요청 데이터가 없으면 종료
      clearVerificationAndNavigate(null)
      return
    }
    submissionMutation.mutate(payload, { // 제출 요청
      onSuccess: (result) => {
        applySubmitSuccess(result) // 제출 성공 처리
        clearVerificationAndNavigate(result.submissionId)
      },
      onError: () => {
        queryClient.invalidateQueries({ queryKey: ['examDeployments'] }) 
        clearVerificationAndNavigate(null)
      },
    })
  }

  return {
    submissionMutation,
    submittedSubmissionId,
    submittedSubmissionIdRef,
    clearVerificationAndNavigate,
    handleSubmit,
    handleSubmitCompleteConfirm,
    handleEndConfirm,
    handleCheatingTerminate,
    submitAndEndByTime,
  }
}
