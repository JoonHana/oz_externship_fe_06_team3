/** 쪽지시험 목록 페이지 경로 */
export const QUIZ_LIST_PATH = '/mypage/quiz'

const QUIZ_VERIFIED_KEY_PREFIX = 'quiz_verified_'

/** 참가코드 검증 완료 여부를 sessionStorage에 저장할 때 사용하는 키 */
export function getQuizVerifiedKey(deploymentId: number): string {
  return `${QUIZ_VERIFIED_KEY_PREFIX}${deploymentId}`
}

/** 잘못된 접근 모달에서 목록으로 자동 이동까지의 시간(ms) */
export const INVALID_ACCESS_AUTO_REDIRECT_MS = 3000
