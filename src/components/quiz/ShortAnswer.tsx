import type { ExamDeploymentDetailResult } from '@/mappers/examDeploymentDetail'
import QuizResultExplanation from './QuizResultExplanation'
import QuestionHeader from './QuestionHeader'

interface ShortAnswerProps {
  question: ExamDeploymentDetailResult['questions'][0]
  answer: string | null
  onAnswerChange: (questionId: number, answer: string) => void
  isResult?: boolean
  isCorrect?: boolean
  explanation?: string | null
}

export default function ShortAnswer({
  question,
  answer,
  onAnswerChange,
  isResult = false,
  isCorrect = false,
  explanation = null,
}: ShortAnswerProps) {
  const containerClass = isResult ? 'mb-[100px]' : 'mb-20'
  const answerColorClass = isResult
    ? isCorrect
      ? 'text-[#14C786]'
      : 'text-error'
    : 'text-foreground-secondary'

  return (
    <div className={containerClass}>
      {/* 문제 헤더 */}
      <QuestionHeader
        number={question.number}
        title={question.question}
        point={question.point}
        typeLabel="단답형"
      />

      <div className="ml-8">
        <input
          type="text"
          value={answer ?? ''}
          onChange={(e) => onAnswerChange(question.questionId, e.target.value)}
          placeholder="20글자 이내로 입력해 주세요."
          className={`h-[48px] w-[648px] rounded-lg bg-surface px-4 py-[10px] text-[16px] font-normal ${answerColorClass} placeholder:text-mono-400`}
        />
      </div>
      {isResult && explanation && (
        <div className="mt-5 ml-8">
          <QuizResultExplanation explanation={explanation} isCorrect={isCorrect} />
        </div>
      )}
    </div>
  )
}
