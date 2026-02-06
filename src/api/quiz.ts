import { apiClient } from '@/api/client'
import { useAuthStore } from '@/store/authStore'
import {
  mapExamDeploymentsResult,
  type ExamDeploymentsResponse,
} from '@/mappers/examDeployments'
import {
  mapExamDeploymentDetail,
  type ExamDeploymentDetailResponse,
} from '@/mappers/examDeploymentDetail'
import {
  mapExamDeploymentStatus,
  type ExamDeploymentStatusResponse,
} from '@/mappers/examDeploymentStatus'
import { mapCheckCodeResult } from '@/mappers/checkCode'
import {
  mapExamSubmissionResult,
  type ExamSubmissionResponse,
} from '@/mappers/examSubmission'
import {
  mapExamSubmissionResult as mapExamSubmissionResultDetail,
  type ExamSubmissionResultResponse,
} from '@/mappers/examSubmissionResult'

export interface FetchExamDeploymentsParams {
  page?: number
  status?: 'all' | 'done' | 'pending'
}

/**
 * 쪽지시험 목록 조회
 * 사용 예:
 * const data = await fetchExamDeployments({ page: 1, status: 'all' })
 */
export const fetchExamDeployments = async (params: FetchExamDeploymentsParams = {}) => {
  const response = await apiClient.get<ExamDeploymentsResponse>('/api/v1/exams/deployments', {
    params: {
      page: params.page ?? 1,
      status: params.status ?? 'all',
    },
  })
  return mapExamDeploymentsResult(response.data)
}

/**
 * 쪽지시험 상세/문항 조회
 * 사용 예:
 * const data = await fetchExamDeploymentDetail(101)
 * 실 API가 { data: ... } 또는 { result: ... } 로 감싸서 보낼 수 있음.
 */
export const fetchExamDeploymentDetail = async (deploymentId: number) => {
  const response = await apiClient.get<
    ExamDeploymentDetailResponse | { data: ExamDeploymentDetailResponse } | { result: ExamDeploymentDetailResponse }
  >(`/api/v1/exams/deployments/${deploymentId}`)
  const raw = response.data as Record<string, unknown>
  let payload: ExamDeploymentDetailResponse = raw?.data && typeof raw.data === 'object'
    ? (raw.data as ExamDeploymentDetailResponse)
    : raw?.result && typeof raw.result === 'object'
      ? (raw.result as ExamDeploymentDetailResponse)
      : (response.data as ExamDeploymentDetailResponse)
  // 실 API가 { exam: { exam_id, duration_time, ... }, questions: [] } 형태일 수 있음
  const payloadRaw = payload as unknown as Record<string, unknown>
  if (payload && payloadRaw.exam != null && Array.isArray(payloadRaw.questions)) {
    const exam = payloadRaw.exam as Record<string, unknown>
    payload = {
      ...(exam as unknown as ExamDeploymentDetailResponse),
      questions: payloadRaw.questions as ExamDeploymentDetailResponse['questions'],
    }
  }
  return mapExamDeploymentDetail(payload)
}

/**
 * 쪽지시험 상태 확인
 * 사용 예:
 * const data = await fetchExamDeploymentStatus(101)
 */
export const fetchExamDeploymentStatus = async (deploymentId: number) => {
  const response = await apiClient.get<ExamDeploymentStatusResponse>(
    `/api/v1/exams/deployments/${deploymentId}/status`
  )
  return mapExamDeploymentStatus(response.data)
}

/**
 * 쪽지시험 입장 코드 검증
 * 성공: 204 No Content (응답 body 없음)
 * 실패: 400, 401, 403, 404, 423
 * 사용 예:
 * const data = await checkExamCode(101, '123456')
 */
export const checkExamCode = async (deploymentId: number, code: string) => {
  const response = await apiClient.post(
    // 백엔드 실제 동작 기준: 언더스코어 버전(/check_code)이 2xx, 하이픈(/check-code)은 404
    `/api/v1/exams/deployments/${deploymentId}/check_code`,
    {
      code,
    }
  )
  // 204 No Content는 응답 body가 없을 수 있음
  return mapCheckCodeResult(response.data ?? {})
}

export interface ExamSubmissionAnswerPayload {
  question_id: number
  type: string
  submitted_answer: unknown
}

export interface ExamSubmissionPayload {
  deployment_id: number
  started_at: string
  cheating_count: number
  answers: ExamSubmissionAnswerPayload[]
}

/**
 * 쪽지시험 제출
 * 사용 예:
 * const data = await submitExam(payload)
 */
export const submitExam = async (payload: ExamSubmissionPayload) => {
  // 로그인 상태의 액세스 토큰을 Authorization 헤더로 포함
  const accessToken = useAuthStore.getState().accessToken
  const config =
    accessToken && accessToken !== ''
      ? { headers: { Authorization: `Bearer ${accessToken}` } }
      : undefined

  const response = await apiClient.post<ExamSubmissionResponse>(
    '/api/v1/exams/submissions',
    payload,
    config
  )
  return mapExamSubmissionResult(response.data)
}

/**
 * 쪽지시험 결과 조회
 * 사용 예:
 * const data = await fetchExamSubmissionResult(350)
 */
export const fetchExamSubmissionResult = async (submissionId: number) => {
  const response = await apiClient.get<ExamSubmissionResultResponse>(
    `/api/v1/exams/submissions/${submissionId}`
  )
  return mapExamSubmissionResultDetail(response.data)
}
