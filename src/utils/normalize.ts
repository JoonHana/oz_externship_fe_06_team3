// 숫자만 추출, 내부 헬퍼 (createDigitsOnlyTransform, normalizePhone에서 사용)
function stripNonDigits(input: string): string {
  return input.replace(/\D/g, '')
}

// 휴대전화 중간/끝 4자리 등 숫자 전용 입력에 사용
export function createDigitsOnlyTransform(maxLength: number) {
  return (v: string) => stripNonDigits(v).slice(0, maxLength)
}

// API 전송용, 숫자만 반환
export function normalizePhone(input: string): string {
  return stripNonDigits(input)
}

// API 전송용, trim + lowercase
export function normalizeEmail(input: string): string {
  return input.trim().toLowerCase()
}
