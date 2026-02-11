import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'

import { Button } from '@/components/common/Button'
import Skeleton from '@/components/common/Skeleton'

const TAB_SWITCH_DELAY_MS = 180
const PREVIEW_IMAGE_SIZE = { width: 1208, height: 603 } as const
const BANNER_IMAGE_SIZE = { width: 1200, height: 277 } as const
const SKELETON_TONE_CLASS = 'bg-[#EEF1F4]'

const TABS = [
  { id: 'exam', label: '쪽지시험', image: '/LandingPage_img/main_exam.png' },
  { id: 'qna', label: '질의응답', image: '/LandingPage_img/main_qna.png' },
  {
    id: 'community',
    label: '커뮤니티',
    image: '/LandingPage_img/main_community.png',
  },
] as const

type TabType = (typeof TABS)[number]['id']

function LandingPage() {
  const [activeTab, setActiveTab] = useState<TabType>('exam')
  const [displayTab, setDisplayTab] = useState<TabType>('exam')
  const [isFadingOut, setIsFadingOut] = useState(false)
  const [isPreviewLoaded, setIsPreviewLoaded] = useState(false)
  const [isBannerLoaded, setIsBannerLoaded] = useState(false)

  const timeoutRef = useRef<number | null>(null)
  const currentTab = useMemo(
    () => TABS.find((tab) => tab.id === displayTab) ?? TABS[0],
    [displayTab]
  )

  const handlePreviewLoaded = () => {
    setIsPreviewLoaded(true)
  }

  const handleTabClick = (nextTab: TabType) => {
    if (nextTab === activeTab) return

    setActiveTab(nextTab)
    setIsFadingOut(true)

    // 탭 전환 애니메이션 지연 동안 중복 타이머를 방지
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current)

    timeoutRef.current = window.setTimeout(() => {
      setDisplayTab(nextTab)
      setIsPreviewLoaded(false)
      setIsFadingOut(false)
    }, TAB_SWITCH_DELAY_MS)
  }

  useEffect(() => {
    // 컴포넌트가 언마운트될 때 타이머 취소
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
    }
  }, [])

  return (
    <div className="min-h-screen bg-white">
      <section className="flex flex-col items-center">
        <div className="w-full bg-gray-50">
          <div
            className={clsx(
              'mx-auto w-full max-w-[1200px] px-5',
              'min-h-[calc(100dvh-var(--header-offset,100px))]',
              'flex flex-col items-center justify-center',
              'py-8',
              'scroll-mt-[var(--header-offset,100px)]',
              'overflow-hidden'
            )}
          >
            <h1 className="text-center text-3xl leading-snug font-bold whitespace-normal sm:text-4xl lg:text-5xl">
              <span className="block sm:pb-1 lg:pb-2">쪽지시험으로</span>
              <span className="block">실력을 차곡차곡 쌓아보세요</span>
            </h1>

            <div className="border-mono-200 mx-auto my-6 w-fit rounded-full border bg-white px-2 py-2 shadow-sm sm:my-10">
              <div className="flex flex-wrap justify-center gap-2">
                {TABS.map((tab) => {
                  const isActive = activeTab === tab.id
                  return (
                    <Button
                      key={tab.id}
                      type="button"
                      variant={isActive ? 'primary' : undefined}
                      size="auto"
                      rounded="full"
                      onClick={() => handleTabClick(tab.id)}
                      aria-pressed={isActive}
                      className={clsx(
                        'h-9 px-4 text-sm whitespace-nowrap transition-all duration-200 sm:h-10 sm:px-6 sm:text-base lg:h-11 lg:px-7',
                        'focus-visible:ring-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                        isActive
                          ? 'shadow-md'
                          : 'text-mono-600 hover:bg-mono-200 border-transparent bg-white'
                      )}
                    >
                      {tab.label}
                    </Button>
                  )
                })}
              </div>
            </div>

            <div className="relative flex w-full items-center justify-center">
              <div
                className={clsx(
                  'relative w-full overflow-hidden rounded-2xl transition-all duration-300 ease-out',
                  isFadingOut
                    ? 'translate-y-2 opacity-0'
                    : 'translate-y-0 opacity-100'
                )}
              >
                <Skeleton
                  className={clsx(
                    `${SKELETON_TONE_CLASS} pointer-events-none absolute inset-0 z-0 h-full w-full rounded-2xl transition-opacity duration-300`,
                    isPreviewLoaded ? 'opacity-0' : 'opacity-100'
                  )}
                />
                <img
                  src={currentTab.image}
                  alt={`${currentTab.label} 화면 미리보기`}
                  width={PREVIEW_IMAGE_SIZE.width}
                  height={PREVIEW_IMAGE_SIZE.height}
                  className={clsx(
                    'relative z-10 h-auto max-h-[45dvh] w-full object-contain sm:max-h-[52dvh] lg:max-h-[58dvh]',
                    'transition-opacity duration-300',
                    isPreviewLoaded ? 'opacity-100' : 'opacity-0'
                  )}
                  draggable={false}
                  onLoad={handlePreviewLoaded}
                  onError={handlePreviewLoaded}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="w-full py-16 sm:py-24 lg:py-40">
          <div className="mx-auto w-full max-w-[1200px] px-5">
            <Link
              to="/qna"
              className="relative block overflow-hidden rounded-2xl shadow-sm transition-shadow hover:shadow-md"
            >
              <Skeleton
                className={clsx(
                  `${SKELETON_TONE_CLASS} pointer-events-none absolute inset-0 z-0 h-full w-full rounded-2xl transition-opacity duration-300`,
                  isBannerLoaded ? 'opacity-0' : 'opacity-100'
                )}
              />
              <img
                src="/LandingPage_img/main_banner.png"
                alt="Q&A 페이지 바로가기"
                width={BANNER_IMAGE_SIZE.width}
                height={BANNER_IMAGE_SIZE.height}
                className={clsx(
                  'relative z-10 h-auto w-full transition-opacity duration-300',
                  isBannerLoaded ? 'opacity-100' : 'opacity-0'
                )}
                onLoad={() => setIsBannerLoaded(true)}
                onError={() => setIsBannerLoaded(true)}
              />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default LandingPage
