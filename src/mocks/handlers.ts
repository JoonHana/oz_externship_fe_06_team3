import { http, HttpResponse } from 'msw'
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
  enrollStudentHandler,
} from './handlers/info'

export const helloHandler = http.get('/api/hello', () => {
  return HttpResponse.json({ message: 'Hello, world!', code: 200 })
})

export const handlers = [
  helloHandler,
  ...authHandlers,
  // Quiz 핸들러들
  examDeploymentsHandler,
  checkCodeHandler,
  examDeploymentDetailHandler,
  examDeploymentStatusHandler,
  examSubmissionHandler,
  examSubmissionResultHandler,
  // Info (수강생 등록) 핸들러들
  coursesHandler,
  cohortsHandler,
  enrollStudentHandler,
]
