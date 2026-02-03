// 인증 코드 유효 시간 (초) - 아이디/비밀번호 찾기, 이메일 인증
export const VERIFICATION_TTL_SECONDS = 5 * 60

// 인증 코드 유효 시간 (분) - useCountdown용
export const VERIFICATION_TTL_MINUTES = Math.ceil(VERIFICATION_TTL_SECONDS / 60)
