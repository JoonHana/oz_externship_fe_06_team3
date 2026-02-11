function toHttps(url: string) {
  if (url.startsWith('http://')) {
    return `https://${url.slice('http://'.length)}`
  }
  if (url.startsWith('//')) {
    return `https:${url}`
  }
  return url
}

/**
 * 외부 프로필 이미지 URL을 https로 정규화해 Mixed Content 경고를 방지한다.
 * - URL 자체가 http면 https로 변환
 * - 쿼리 파라미터 값에 포함된 http URL도 https로 변환 (예: kakao CDN fname 파라미터)
 */
export function normalizeProfileImageUrl(
  url: string | null | undefined
): string | null | undefined {
  if (!url) return url

  const normalized = toHttps(url.trim())

  try {
    const parsed = new URL(normalized)
    parsed.searchParams.forEach((value, key) => {
      if (value.startsWith('http://')) {
        parsed.searchParams.set(key, `https://${value.slice('http://'.length)}`)
      }
    })
    return parsed.toString()
  } catch {
    return normalized
  }
}
