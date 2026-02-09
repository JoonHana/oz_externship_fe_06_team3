import { useEffect } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { Button, Loading } from '@/components/common'
import { QUIZ_LIST_PATH } from '@/constants/quiz'
import QuizHeader from '@/components/quiz/QuizHeader'
import QuizResultTop from '@/components/quiz/QuizResultTop'
import { useExamSubmissionResultQuery } from '@/hooks/useQuiz'
import { ResultQuestionItem } from '@/components/quiz'

// 분당 밀리초 수
const MS_PER_MINUTE = 60_000
// 분당 초 수
const SECONDS_PER_MINUTE = 60

/**
 * 응시시간(분) 계산
 * - API의 elapsed_time(초)이 0 이상이면 우선 사용
 * - 없으면 started_at ~ submitted_at 차이로 계산 (1분 미만이면 0)
 * - fallback은 0 미만이면 0으로 처리
 */
function getElapsedMinutes(
  startedAt: string | undefined,
  submittedAt: string | undefined,
  elapsedTimeSeconds: number
): number {
  if (elapsedTimeSeconds >= 0) {
    return Math.max(0, Math.floor(elapsedTimeSeconds / SECONDS_PER_MINUTE))
  }
  if (!startedAt || !submittedAt) return 0
  const started = new Date(startedAt).getTime()
  const submitted = new Date(submittedAt).getTime()
  return Math.max(0, Math.floor((submitted - started) / MS_PER_MINUTE))
}

// 결과 헤더 메시지
function buildResultHeaderMessage(
  questionCount: number,
  cheatingCount: number,
  elapsedMinutes: number,
  totalScore: number,
  maxScore: number
): string {
  return `총 문항 수: ${questionCount} ㆍ 부정행위: ${cheatingCount}회 ㆍ 응시시간: ${elapsedMinutes}분 ㆍ 응시 결과 점수: ${totalScore}점/${maxScore}점`
}


function QuizResultPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { submissionId } = useParams<{ submissionId: string }>()
  const submissionIdNumber = submissionId ? Number(submissionId) : 0

  const { data, isLoading } = useExamSubmissionResultQuery(
    submissionIdNumber,
    !!submissionId
  )

  const goToList = () => navigate(QUIZ_LIST_PATH)

  // 결과 페이지 진입 시 히스토리에 목록 URL 추가 → 브라우저 뒤로가기 시 목록으로 이동
  useEffect(() => {
    if (!submissionId) return
    const resultPath = location.pathname
    window.history.pushState(null, '', QUIZ_LIST_PATH)
    window.history.pushState(null, '', resultPath)
  }, [submissionId, location.pathname])

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center">
        <Loading />
      </div>
    )
  }

  const questionCount = data?.questions.length ?? 0
  const cheatingCount = data?.cheatingCount ?? 0
  const elapsedMinutes = getElapsedMinutes(
    data?.startedAt,
    data?.submittedAt,
    data?.elapsedTime ?? -1
  )
  const maxScore =
    data?.questions.reduce((sum, q) => sum + (q.point ?? 0), 0) ?? 0
  const totalScore = data?.totalScore ?? 0
  const headerMessage = buildResultHeaderMessage(
    questionCount,
    cheatingCount,
    elapsedMinutes,
    totalScore,
    maxScore
  )

  return (
    <div>
      <QuizHeader
        subjectName={data?.exam.title}
        message={headerMessage}
        showExamStatus={false}
      />

      <main>
        <QuizResultTop />
        <div className="flex justify-center">
          <div className="w-[1290px] space-y-6 py-10 pt-16">
            {data?.questions?.map((question, index) => (
              <div key={question.id} className="space-y-4">
                <ResultQuestionItem question={question} index={index} />
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer>
        <div className="mb-10 flex justify-center">
          <Button
            variant="primary"
            size="xs"
            rounded="default"
            onClick={goToList}
          >
            완료
          </Button>
        </div>
      </footer>
    </div>
  )
}

export default QuizResultPage
