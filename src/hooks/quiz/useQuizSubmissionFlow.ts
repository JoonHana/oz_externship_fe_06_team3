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

  const applySubmitSuccess = (result: { submissionId: number }) => {
    setSubmittedSubmissionId(result.submissionId)
    submittedSubmissionIdRef.current = result.submissionId
    queryClient.invalidateQueries({ queryKey: ['examDeployments'] })
  }

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
    })
    return {
      deployment_id: deploymentIdNumber,
      started_at: new Date().toISOString(),
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

  return {
    submissionMutation,
    submittedSubmissionId,
    submittedSubmissionIdRef,
    applySubmitSuccess,
    clearVerificationAndNavigate,
    buildSubmitPayload,
    handleSubmit,
    handleSubmitCompleteConfirm,
    handleEndConfirm,
    handleCheatingTerminate,
    submitAndEndByTime,
  }
}
