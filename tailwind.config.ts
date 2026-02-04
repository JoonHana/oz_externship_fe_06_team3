import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Pretendard Variable',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'sans-serif',
        ],
      },
      colors: {
        primary: {
          DEFAULT: '#6201E0',
          hover: '#4E01B3',
          active: '#380186',
          100: '#EFE6FC',
          400: '#721AE3',
        },
        mono: {
          200: '#ECECEC',
          250: '#CECECE',
          400: '#BDBDBD',
          600: '#9D9D9D',
        },
        /** 에러/경고 */
        error: {
          DEFAULT: '#EC0037',
          50: '#fef2f2',
          200: '#fecaca',
          800: '#991b1b',
        },
        /** 성공/확인 */
        success: {
          DEFAULT: '#16a34a',
          50: '#f0fdf4',
          200: '#bbf7d0',
          500: '#22c55e',
          800: '#166534',
        },
        /** 본문 텍스트 */
        foreground: '#121212',
        /** 본문 보조 (조금 더 연한) */
        'foreground-secondary': '#222222',
        /** 보조 텍스트 */
        muted: '#4D4D4D',
        /** 보조 텍스트 (더 진한) */
        'muted-dark': '#303030',
        /** 연한 배경 */
        surface: '#F2F3F5',
        /** 경고/주의 */
        warning: '#F85402',
        kakao: {
          text: '#391C1A', // 카카오 버튼 텍스트 색상
        },
        'placeholder-a': {
          DEFAULT: '#9D9D9D', // 연한 회색 (플레이스홀더용)
        },
      },
    },
  },
  plugins: [],
}

export default config
