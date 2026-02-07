import { useNavigate, useParams } from 'react-router-dom'
import { Button, Loading } from '@/components/common'
import { QUIZ_LIST_PATH } from '@/constants/quiz'
import QuizHeader from '@/components/quiz/QuizHeader'
import QuizResultTop from '@/components/quiz/QuizResultTop'
import { useExamSubmissionResultQuery } from '@/hooks/useQuiz'
import { ResultQuestionItem } from '@/components/quiz'

function QuizResultPage() {
  const navigate = useNavigate()
  const { submissionId } = useParams<{ submissionId: string }>()
  const submissionIdNumber = submissionId ? Number(submissionId) : 0

  const { data, isLoading } = useExamSubmissionResultQuery(
    submissionIdNumber,
    !!submissionId
  )

  const handleSubmit = () => {
    navigate(QUIZ_LIST_PATH)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center">
        <Loading />
      </div>
    )
  }

  const questionCount = data?.questions.length ?? 0
  const cheatingCount = data?.cheatingCount ?? 0

  // startedAt / submittedAt 기준 실제 응시 시간 (분 단위, 초는 버림)
  let elapsedMinutes = data?.elapsedTime ?? 0
  if (data?.startedAt && data?.submittedAt) {
    const started = new Date(data.startedAt)
    const submitted = new Date(data.submittedAt)
    const diffMs = submitted.getTime() - started.getTime()
    elapsedMinutes = Math.max(0, Math.floor(diffMs / 60000))
  }

  const maxScore =
    data?.questions.reduce((sum, question) => sum + (question.point ?? 0), 0) ??
    0
  const totalScore = data?.totalScore ?? 0

  return (
    <div>
      <QuizHeader
        subjectName={data?.exam.title}
        message={`총 문항 수: ${questionCount} ㆍ 부정행위: ${cheatingCount}회 ㆍ 응시시간: ${elapsedMinutes}분 ㆍ 응시 결과 점수: ${totalScore}점/${maxScore}점`}
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
            onClick={handleSubmit}
          >
            완료
          </Button>
        </div>
      </footer>
    </div>
  )
}

export default QuizResultPage
