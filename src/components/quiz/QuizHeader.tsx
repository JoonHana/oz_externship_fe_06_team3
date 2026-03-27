import { Link } from 'react-router-dom'

// 스타일 선언명 정의
const titleStyle = 'text-black font-semibold text-[20px]'
const contentStyle = 'text-[#4D4D4D] font-normal text-[16px] ml-12'
const infoBoxStyle = 'flex items-center gap-2 rounded-[30px] bg-white border border-[#ECECEC] px-6 py-3'
const timerTextStyle = 'text-[#6201E0] text-[18px]'
const timerNumberStyle = 'text-[#6201E0] font-semibold text-[18px]'
const warningLabelStyle = 'text-gray-700 font-semibold text-[18px] px-1'
const warningIconBoxStyle = 'h-6 w-4 rounded flex items-center justify-center'
const warningIconDefaultStyle = 'border border-gray-300 bg-white'
const warningIconTextStyle = 'text-gray-400 text-sm'
const warningActiveStyle = 'border-[#FFAE00] bg-[#FFAE00]'
const dangerActiveStyle = 'border-[#EC0037] bg-[#EC0037]'

interface QuizHeaderProps {
  subjectName?: string
  message?: string
  timeRemaining?: string
  timeRemainingSuffix?: string
  cheatingCount?: number
  /** 우측 타이머/부정행위 영역 노출 여부 (기본값: true) */
  showExamStatus?: boolean
}

function QuizHeader({
  subjectName = 'TypeScript 쪽지시험',
  message = '집중해서 천천히, 끝까지 응시해 주세요. 응원할게요 💪',
  timeRemaining = '29 : 17',
  timeRemainingSuffix = '뒤에 끝나요',
  cheatingCount: _cheatingCount = 0,
  showExamStatus = true,
}: QuizHeaderProps) {
  const maxCheatingCount = 3
  const cheatingCount = Math.min(Math.max(_cheatingCount, 0), maxCheatingCount)

  const getWarningBoxClass = (index: number) => {
    if (cheatingCount <= index) return `${warningIconBoxStyle} ${warningIconDefaultStyle}`
    if (index === maxCheatingCount - 1) {
      return `${warningIconBoxStyle} ${dangerActiveStyle}`
    }
    return `${warningIconBoxStyle} ${warningActiveStyle}`
  }

  const getWarningTextClass = (index: number) =>
    cheatingCount > index ? 'text-white text-sm' : warningIconTextStyle

  return (
    <header className="border-b border-gray-200 bg-[#FAFAFA] px-6 py-6 border-b-4 border-[#BDBDBD] shadow-lg">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between">
        {/* 좌측 영역 */}
        <div className="flex flex-col">
          <div className="flex items-center gap-3">
            <Link
              to="/mypage/quiz"
              className="flex items-center justify-center rounded-md p-1 text-black transition-colors hover:bg-gray-100 text-3xl"
              aria-label="뒤로가기"
            >
              ←
            </Link>
            <h1 className={titleStyle}>{subjectName} 쪽지시험</h1>
          </div>
          <p className={contentStyle}>{message}</p>
        </div>

        {/* 우측 영역 (타이머 + 부정행위). 결과 페이지 등에서는 숨길 수 있도록 옵션 제공 */}
        {showExamStatus && (
          <div className="flex items-center gap-4">
            {/* 타이머 박스 */}
            <div className={infoBoxStyle}>
              <span className={timerNumberStyle}>{timeRemaining}</span>
              <span className={timerTextStyle}> {timeRemainingSuffix}</span>
            </div>
            {/* 부정행위 카운트 */}
            <div className={infoBoxStyle}>
              <span className={warningLabelStyle}>부정행위</span>
              <div className="flex gap-1">
                {Array.from({ length: maxCheatingCount }).map((_, index) => (
                  <div key={index} className={getWarningBoxClass(index)}>
                    <span className={getWarningTextClass(index)}>!</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

export default QuizHeader
