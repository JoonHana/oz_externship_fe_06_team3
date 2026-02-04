import { HttpResponse } from 'msw'

export const UNAUTHORIZED_MESSAGE = '자격 인증 데이터가 제공되지 않았습니다.'
export const FORBIDDEN_MESSAGE = '이 리소스를 조회할 권한이 없습니다.'

export function unauthorizedResponse(request: Request) {
  if (!request.headers.get('Authorization')?.startsWith('Bearer ')) {
    return HttpResponse.json({ error_detail: UNAUTHORIZED_MESSAGE }, { status: 401 })
  }
  return null
}
