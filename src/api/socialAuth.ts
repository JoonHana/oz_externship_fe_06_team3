import type { SocialProviderId } from '@/types/social'

// 소셜 로그인/가입 리다이렉트
export function createSocialRedirect(provider: SocialProviderId) {
  const baseUrl = import.meta.env.VITE_API_BASE_URL ?? ''
  window.location.href = `${baseUrl}/api/v1/accounts/login/${provider}/`
}
