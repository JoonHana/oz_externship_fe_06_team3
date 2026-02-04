import { http, HttpResponse } from 'msw'
import courses from '@/mocks/data/courses.json'
import { FORBIDDEN_MESSAGE, unauthorizedResponse } from './constants'

export const coursesHandler = http.get('/api/v1/course/', ({ request }) => {
  const res = unauthorizedResponse(request)
  if (res) return res
  if (request.headers.get('X-Mock-Forbidden') === 'true') {
    return HttpResponse.json({ error_detail: FORBIDDEN_MESSAGE }, { status: 403 })
  }
  return HttpResponse.json(courses)
})
