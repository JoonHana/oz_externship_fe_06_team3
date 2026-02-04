import { useNavigate, useParams } from 'react-router-dom'
import { Button, Loading } from '@/components/common'
import QuizHeader from '@/components/quiz/QuizHeader'
import QuizResultTop from '@/components/quiz/QuizResultTop'
import { useExamSubmissionResultQuery } from '@/hooks/useQuiz'
import {
  SingleChoice,
  MultipleChoice,
  OX,
  FillBlank,
  Ordering,
  ShortAnswer,
} from '@/components/quiz'
import type { ExamDeploymentDetailResult } from '@/mappers/examDeploymentDetail'

type QuizQuestion = ExamDeploymentDetailResult['questions'][0]

function QuizResultPage() {
  const navigate = useNavigate()
  const { submissionId } = useParams<{ submissionId: string }>()
  const submissionIdNumber = submissionId ? Number(submissionId) : 0

  const { data, isLoading } = useExamSubmissionResultQuery(
    submissionIdNumber,
    !!submissionId
  )

  const handleSubmit = () => {
    navigate('/mypage/quiz')
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

  const renderQuestion = (
    question: NonNullable<typeof data>['questions'][0],
    index: number
  ) => {
    const mapped: QuizQuestion = {
      questionId: question.id,
      number: index + 1,
      type: question.type as QuizQuestion['type'],
      question: question.question,
      point: question.point,
      prompt: question.prompt,
      blankCount: question.blankCount,
      options: question.options,
      answerInput: null,
    }

    const submitted = question.submittedAnswer

    switch (question.type) {
      case 'single_choice':
        return (
          <SingleChoice
            question={mapped}
            answer={(submitted?.[0] ?? null) as string | null}
            onAnswerChange={() => {}}
            isResult
            correctAnswer={(question.answer?.[0] ?? null) as string | null}
            isCorrect={question.isCorrect}
            explanation={question.explanation}
          />
        )
      case 'multiple_choice':
        return (
          <MultipleChoice
            question={mapped}
            answer={(submitted ?? null) as string[] | null}
            onAnswerChange={() => {}}
            isResult
            correctAnswer={(question.answer ?? null) as string[] | null}
            isCorrect={question.isCorrect}
            explanation={question.explanation}
          />
        )
      case 'short_answer':
        return (
          <ShortAnswer
            question={mapped}
            answer={(submitted?.[0] ?? '') as string}
            onAnswerChange={() => {}}
            isResult
            isCorrect={question.isCorrect}
            explanation={question.explanation}
          />
        )
      case 'ox':
        return (
          <OX
            question={mapped}
            answer={(submitted?.[0] ?? null) as string | null}
            onAnswerChange={() => {}}
            isResult
            correctAnswer={(question.answer?.[0] ?? null) as string | null}
            isCorrect={question.isCorrect}
            explanation={question.explanation}
          />
        )
      case 'fill_blank':
        return (
          <FillBlank
            question={mapped}
            answer={(submitted ?? null) as string[] | null}
            onAnswerChange={() => {}}
            isResult
            correctAnswer={(question.answer ?? null) as string[] | null}
            isCorrect={question.isCorrect}
            explanation={question.explanation}
          />
        )
      case 'ordering':
        return (
          <Ordering
            question={mapped}
            answer={(submitted ?? null) as string[] | null}
            onAnswerChange={() => {}}
            isResult
            correctAnswer={(question.answer ?? null) as string[] | null}
            isCorrect={question.isCorrect}
            explanation={question.explanation}
          />
        )
      default:
        return null
    }
  }

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
                {renderQuestion(question, index)}
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
