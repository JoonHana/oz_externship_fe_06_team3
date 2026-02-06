// 소셜 로그인 버튼 (카카오, 네이버) - createSocialRedirect 호출
import { Button } from '@/components/common/Button'
import type { SocialProviderId } from '@/types/social'

const SOCIAL_PROVIDERS_LOGIN = [
  {
    id: 'kakao' as const,
    variant: 'kakao' as const,
    logo: '/LoginPage_img/kakao_logo.svg',
    alt: 'Kakao',
    label: '카카오 간편 로그인 / 가입',
    textClass: 'text-kakao-text',
    logoClass: 'h-3 w-[13px]',
  },
  {
    id: 'naver' as const,
    variant: 'naver' as const,
    logo: '/LoginPage_img/naver_logo.svg',
    alt: 'Naver',
    label: '네이버 간편 로그인 / 가입',
    textClass: 'text-white',
    logoClass: 'h-[13px] w-[13px]',
  },
]

const SOCIAL_PROVIDERS_SIGNUP = [
  {
    ...SOCIAL_PROVIDERS_LOGIN[0],
    label: '카카오로 3초만에 가입하기',
  },
  {
    ...SOCIAL_PROVIDERS_LOGIN[1],
    label: '네이버로 가입하기',
  },
]

type Props = {
  onLogin: (provider: SocialProviderId) => void
  mode?: 'login' | 'signup'
}

export default function SocialLoginSection({ onLogin, mode = 'login' }: Props) {
  const providers =
    mode === 'signup' ? SOCIAL_PROVIDERS_SIGNUP : SOCIAL_PROVIDERS_LOGIN
  return (
    <div className="flex w-full flex-col items-start gap-3">
      {providers.map((provider) => (
        <Button
          key={provider.id}
          type="button"
          variant={provider.variant}
          onClick={() => onLogin(provider.id)}
          className="h-[52px] w-full gap-2.5 rounded px-2 py-2"
        >
          <div className="inline-flex items-center gap-1">
            <div className="flex w-5 flex-col items-center justify-center gap-2.5 px-[3px] py-1">
              <img
                className={provider.logoClass}
                alt={provider.alt}
                src={provider.logo}
              />
            </div>
            <p
              className={`text-[16px] font-normal tracking-[-0.32px] whitespace-nowrap ${provider.textClass}`}
            >
              {provider.label}
            </p>
          </div>
        </Button>
      ))}
    </div>
  )
}
