import { useState } from 'react'

function QuizWarningBox() {
  const [showWarning, setShowWarning] = useState(true)

  const handleCloseWarning = () => {
    setShowWarning(false)
  }

  if (!showWarning) {
    return null
  }

  return (
    <div className="mb-10 flex min-w-[1200px] items-start gap-3 rounded-lg bg-primary-100 px-6 py-5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full">
        <img
          src="/alertCircle.svg"
          alt="경고"
          className="h-8 w-8"
        />
      </div>
      <div className="flex-1">
        <h2 className="mb-3 text-[18px] font-semibold text-foreground">
          시험에만 집중해 주세요
        </h2>
        <p className="text-[14px] font-normal text-foreground">
          탭이나 창을 이동하면 부정행위로 처리돼 시험이 중단될 수 있어요. 안정적인 환경에서 시험을 이어가 주세요.
        </p>
      </div>
      <button
        type="button"
        onClick={handleCloseWarning}
        aria-label="닫기"
        className="flex items-center justify-center"
      >
        <svg
          className="h-5 w-5 text-foreground"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  )
}

export default QuizWarningBox
