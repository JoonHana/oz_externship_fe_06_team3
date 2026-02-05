import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/common/Button'
import { Skeleton } from '@/components/common'
import { StartQuizModal } from '@/components/common/Modal'
import type { ExamDeploymentsResult } from '@/mappers/examDeployments'

interface QuizCardProps {
  quiz?: ExamDeploymentsResult['results'][0]
  skeleton?: boolean
}

// 레이아웃 스타일
const CARD_CLASS =
  'flex items-center gap-4 px-8 py-7 bg-[#FAFAFA] border border-[#ECECEC] rounded-lg'
const ICON_CONTAINER_CLASS = 'flex-center w-12 h-12'
const INFO_CONTAINER_CLASS = 'flex-1 min-w-0'
const TITLE_CONTAINER_CLASS = 'flex items-center gap-4 mb-1'

// 스켈레톤 스타일
const SKELETON_ICON_CLASS = 'h-12 w-12 rounded'
const SKELETON_TITLE_CLASS = 'h-5 w-48'
const SKELETON_BADGE_CLASS = 'h-5 w-14 rounded-[3px]'
const SKELETON_SCORE_CLASS = 'h-4 w-64'
const SKELETON_BUTTON_CLASS = 'h-12 w-[112px] rounded-[4px]'

// 카드 스타일
const FALLBACK_ICON_CLASS =
  'w-full h-full bg-primary-100 flex items-center justify-center text-primary font-bold'
const SCORE_CLASS = 'flex items-center gap-2 text-[14px] font-normal text-[#303030]'
const STATUS_DONE_CLASS =
  'px-1.5 py-1 rounded-[3px] text-xs font-normal text-[#085036] bg-[#CAF6E6]'
const STATUS_PENDING_CLASS =
  'px-1.5 py-1 rounded-[3px] text-xs font-normal text-[#5E0016] bg-[#FFC1D0]'
const BUTTON_CLASS =
  'w-[112px] h-[48px] border border-[#6201E0] rounded-[4px] bg-[#EFE6FC] text-[16px] font-semibold text-[#6201E0] hover:text-white'

  // 스켈레톤 UI
function QuizCardSkeletonView() {
  return (
    <div className={CARD_CLASS}>
      <div className={ICON_CONTAINER_CLASS}>
        <Skeleton className={SKELETON_ICON_CLASS} />
      </div>
      <div className={INFO_CONTAINER_CLASS}>
        <div className={TITLE_CONTAINER_CLASS}>
          <Skeleton className={SKELETON_TITLE_CLASS} />
          <Skeleton className={SKELETON_BADGE_CLASS} />
        </div>
        <Skeleton className={SKELETON_SCORE_CLASS} />
      </div>
      <Skeleton className={SKELETON_BUTTON_CLASS} />
    </div>
  )
}

// 카드 UI
export default function QuizCard({ quiz, skeleton = false }: QuizCardProps) {
  const navigate = useNavigate()
  const [imageError, setImageError] = useState(false)
  const [fallbackImageError, setFallbackImageError] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  if (skeleton) return <QuizCardSkeletonView />
  if (!quiz) return null

  // quiz 기반 파생 값
  const isDone = quiz.isDone
  const subjectName = quiz.exam.subject.title
  const imageUrl = quiz.exam.subject.thumbnailImgUrl || quiz.exam.thumbnailImgUrl
  const fallbackImageUrl = `/icons/Course/${subjectName}.svg`
  const scoreText = isDone
    ? `${quiz.examInfo.score}점/${quiz.totalScore}점 ㆍ ${quiz.examInfo.correctAnswerCount}/${quiz.questionCount}개 정답`
    : '응시하고 점수를 확인해보세요!'
  const buttonText = isDone ? '상세보기' : '응시하기'
  const statusClass = isDone ? STATUS_DONE_CLASS : STATUS_PENDING_CLASS

  // 핸들러
  const handleImageError = () => setImageError(true)
  const handleFallbackImageError = () => setFallbackImageError(true)
  const handleButtonClick = () => {
    // 디버깅: quiz 객체 전체 확인
    console.log('[QuizCard] quiz 객체 전체:', JSON.stringify(quiz, null, 2))
    console.log('[QuizCard] quiz.id (deploymentId로 사용될 값):', quiz.id)
    
    if (isDone && quiz.submissionId) {
      navigate(`/quiz/result/${quiz.submissionId}`)
    } else {
      setIsModalOpen(true)
    }
  }
  const handleModalClose = () => setIsModalOpen(false)

  // 아이콘 렌더링: 썸네일 → 과목 폴백 → 첫 글자
  const renderIcon = () => {
    if (imageUrl && !imageError) {
      return <img src={imageUrl} onError={handleImageError} alt="" />
    }
    if (!fallbackImageError) {
      return (
        <img src={fallbackImageUrl} onError={handleFallbackImageError} alt="" />
      )
    }
    return (
      <div className={FALLBACK_ICON_CLASS}>{subjectName.charAt(0)}</div>
    )
  }

  return (
    <div className={CARD_CLASS}>
      <div className={ICON_CONTAINER_CLASS}>{renderIcon()}</div>

      <div className={INFO_CONTAINER_CLASS}>
        <div className={TITLE_CONTAINER_CLASS}>
          <p className="title-m-b">{quiz.exam.title}</p>
          <p className={statusClass}>{isDone ? '응시완료' : '미응시'}</p>
        </div>
        <div className={SCORE_CLASS}>
          <p>{quiz.exam.subject.title}ㆍ{scoreText}</p>
        </div>
      </div>

      <div>
        <Button onClick={handleButtonClick} className={BUTTON_CLASS}>
          {buttonText}
        </Button>
      </div>

      {!isDone && (
        <StartQuizModal
  isOpen={isModalOpen}
  onClose={handleModalClose}
  deploymentId={quiz.id}          // ✅ 다시 목록에서 받은 id 사용
  imageUrl={imageUrl || fallbackImageUrl}
  subjectName={quiz.exam.subject.title}
  quizName={quiz.exam.title}
  questionCount={quiz.questionCount}
  timeLimit={quiz.durationTime}
/>
      )}
    </div>
  )
}

