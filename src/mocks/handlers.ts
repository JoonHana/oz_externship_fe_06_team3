import { http, HttpResponse, passthrough } from 'msw'
import { checkCodeHandler } from './handlers/quiz/checkCode'
import { examDeploymentDetailHandler } from './handlers/quiz/examDeploymentDetail'
import { examDeploymentStatusHandler } from './handlers/quiz/examDeploymentStatus'
import { examDeploymentsHandler } from './handlers/quiz/examDeployments'
import { examSubmissionHandler } from './handlers/quiz/examSubmission'
import { examSubmissionResultHandler } from './handlers/quiz/examSubmissionResult'
import { authHandlers } from './handlers/auth.mock'
import {
  coursesHandler,
  cohortsHandler,
  enrolledCoursesHandler,
  enrollStudentHandler,
} from './handlers/info'

export const helloHandler = http.get('/api/hello', () => {
  return HttpResponse.json({ message: 'Hello, world!', code: 200 })
})

/** SPA 라우트 문서 요청(페이지 로드/새로고침) — MSW 미처리 경고 방지용 통과 */
export const mypageProfilePassthroughHandler = http.get(
  '/mypage/profile',
  () => passthrough()
)

export const handlers = [
  helloHandler,
  mypageProfilePassthroughHandler,
  ...authHandlers,
  // Quiz 핸들러들
  examDeploymentsHandler,
  checkCodeHandler,
  examDeploymentDetailHandler,
  examDeploymentStatusHandler,
  examSubmissionHandler,
  examSubmissionResultHandler,
  // Info (수강생 등록·내 과정) 핸들러들
  coursesHandler,
  cohortsHandler,
  enrolledCoursesHandler,
  enrollStudentHandler,
]
