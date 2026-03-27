import { http, HttpResponse } from 'msw'
import { unauthorizedResponse } from './constants'

const COHORT_ID_REQUIRED = { error_detail: { cohort_id: ['이 필드는 필수 항목입니다.'] } }

/** 웹 개발 초격차 프론트엔드 부트캠프 10기 → 409, 11기 → 403 (MSW 개발용) */
const COHORT_10TH_ID = 101 // course_id 1, number 10
const COHORT_11TH_ID = 102 // course_id 1, number 11

export const enrollStudentHandler = http.post(
  '/api/v1/accounts/enroll-student/',
  async ({ request }) => {
    const res = unauthorizedResponse(request)
    if (res) return res

    const body = (await request.json()) as { cohort_id?: number }
    if (body.cohort_id == null || typeof body.cohort_id !== 'number') {
      return HttpResponse.json(COHORT_ID_REQUIRED, { status: 400 })
    }
    if (body.cohort_id === COHORT_10TH_ID) {
      return HttpResponse.json(
        { error_detail: '이미 해당 기수에 등록 신청하였습니다.' },
        { status: 409 }
      )
    }
    if (body.cohort_id === COHORT_11TH_ID) {
      return HttpResponse.json(
        { error_detail: '이미 수강생 등록 완료된 회원입니다.' },
        { status: 403 }
      )
    }
    return HttpResponse.json({ detail: '수강 신청이 완료되었습니다.' })
  }
)
