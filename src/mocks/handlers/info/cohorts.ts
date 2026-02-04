import { http, HttpResponse } from 'msw'
import cohorts from '@/mocks/data/cohorts.json'
import type { Cohort } from '@/types/info'
import { unauthorizedResponse } from './constants'

const list = cohorts as Cohort[]

export const cohortsHandler = http.get(
  '/api/v1/:courseId/cohorts',
  ({ request, params }) => {
    const res = unauthorizedResponse(request)
    if (res) return res

    const courseId = Number(params.courseId)
    if (Number.isNaN(courseId)) {
      return HttpResponse.json(
        { error_detail: 'course_id는 숫자여야 합니다.' },
        { status: 400 }
      )
    }

    const filtered: Cohort[] = list.filter((c) => c.course_id === courseId)
    return HttpResponse.json(filtered)
  }
)
