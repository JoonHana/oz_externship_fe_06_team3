import { http, HttpResponse } from 'msw'

/** 실 API와 동일한 경로: /check_code (언더스코어) */
const CHECK_CODE_PATH = '/api/v1/exams/deployments/:deploymentId/check_code'

/** 목 데이터에서 허용하는 참가코드 (아무 코드나 통과시키려면 여기 추가) */
const VALID_CODES = new Set(['aA1234', '000000'])

export const checkCodeHandler = http.post(CHECK_CODE_PATH, async ({ request }) => {
  let body: { code?: string } = {}
  try {
    body = (await request.json()) as { code?: string }
  } catch {
    body = {}
  }

  if (!body.code || String(body.code).trim() === '') {
    return HttpResponse.json(
      { error_detail: '이 필드는 필수 항목입니다.' },
      { status: 400 }
    )
  }

  if (!VALID_CODES.has(String(body.code).trim())) {
    return HttpResponse.json(
      { error_detail: '코드번호가 일치하지 않습니다.' },
      { status: 400 }
    )
  }

  return HttpResponse.json({}, { status: 204 })
})
