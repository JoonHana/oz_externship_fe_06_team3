import { http, HttpResponse } from 'msw'
import { unauthorizedResponse } from './constants'

const COHORT_ID_REQUIRED = { error_detail: { cohort_id: ['이 필드는 필수 항목입니다.'] } }

export const enrollStudentHandler = http.post(
  '/api/v1/accounts/enroll-student/',
  async ({ request }) => {
    const res = unauthorizedResponse(request)
    if (res) return res

    const body = (await request.json()) as { cohort_id?: number }
    if (body.cohort_id == null || typeof body.cohort_id !== 'number') {
      return HttpResponse.json(COHORT_ID_REQUIRED, { status: 400 })
    }
    return HttpResponse.json({ detail: '수강 신청이 완료되었습니다.' })
  }
)
