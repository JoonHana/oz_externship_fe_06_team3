// 아이디 찾기 결과 등에서 이메일 마스킹 표시용 (백엔드 마스킹값이면 그대로, @ 있으면 local-part만 마스킹)
export function maskEmailForDisplay(email: string): string {
  const trimmed = email.trim()
  if (!trimmed) return trimmed
  if (/\*/.test(trimmed)) return trimmed
  const atIndex = trimmed.indexOf('@')
  if (atIndex === -1) return trimmed
  const local = trimmed.slice(0, atIndex)
  const domain = trimmed.slice(atIndex)
  if (local.length <= 2) {
    return `${'*'.repeat(local.length)}${domain}`
  }
  const visibleStart = local.slice(0, 1)
  const visibleEnd = local.slice(-1)
  const midLen = Math.max(0, local.length - 2)
  return `${visibleStart}${'*'.repeat(midLen)}${visibleEnd}${domain}`
}
