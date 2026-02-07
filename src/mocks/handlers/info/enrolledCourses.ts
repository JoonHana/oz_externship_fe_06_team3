import { http, HttpResponse } from 'msw'
import { unauthorizedResponse } from './constants'
import type { CourseEnrollment } from '@/types/info'

/** GET /api/v1/accounts/me/enrolled-courses/ — 내 수강 중인 과정 목록 (목 데이터) */
export const enrolledCoursesHandler = http.get(
  '/api/v1/accounts/me/enrolled-courses/',
  ({ request }) => {
    const res = unauthorizedResponse(request)
    if (res) return res

    const mockEnrolled: CourseEnrollment[] = []
    return HttpResponse.json(mockEnrolled)
  }
)
