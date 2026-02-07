import { http, HttpResponse } from 'msw'
import examSubmissionResult from '@/mocks/data/examSubmissionResult.json'

/** POST 제출 시 사용하는 공식: submission_id = 300 + deployment_id */
const SUBMISSION_ID_OFFSET = 300

export const examSubmissionResultHandler = http.get(
  '/api/v1/exams/submissions/:submissionId',
  ({ params }) => {
    const submissionId = Number(params.submissionId)
    if (!Number.isFinite(submissionId) || submissionId < 1) {
      return HttpResponse.json(
        { error_detail: '제출 결과를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    const deploymentId = submissionId - SUBMISSION_ID_OFFSET
    const payload = {
      ...examSubmissionResult,
      id: submissionId,
      submitter_id: examSubmissionResult.submitter_id,
      deployment_id: deploymentId > 0 ? deploymentId : examSubmissionResult.deployment_id,
    }
    return HttpResponse.json(payload)
  }
)
