import { useState, useEffect } from 'react'
import type { ExamDeploymentDetailResult } from '@/mappers/examDeploymentDetail'
import QuizResultExplanation from './QuizResultExplanation'
import QuestionHeader from './QuestionHeader'

interface FillBlankProps {
  question: ExamDeploymentDetailResult['questions'][0]
  answer: string[] | null
  onAnswerChange: (questionId: number, answer: string[]) => void
  isResult?: boolean
  correctAnswer?: string[] | null
  isCorrect?: boolean
  explanation?: string | null
}

const BLANK_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] as const

export default function FillBlank({
  question,
  answer,
  onAnswerChange,
  isResult = false,
  correctAnswer = null,
  isCorrect = false,
  explanation = null,
}: FillBlankProps) {
  const blankCount = question.blankCount || 0
  const blankLabels = BLANK_LABELS.slice(0, blankCount)

  const [answers, setAnswers] = useState<string[]>(() =>
    answer || Array(blankCount).fill('')
  )

  useEffect(() => {
    if (answer) {
      setAnswers(answer)
    } else {
      setAnswers(Array(blankCount).fill(''))
    }
  }, [answer, blankCount])

  const handleInputChange = (index: number, value: string) => {
    if (isResult) return
    const newAnswers = [...answers]
    newAnswers[index] = value
    setAnswers(newAnswers)
    onAnswerChange(question.questionId, newAnswers)
  }

  const getBlankColorClass = (index: number) => {
    if (!isResult) return 'text-foreground-secondary'
    const submitted = answers[index] ?? ''
    const correct = correctAnswer?.[index] ?? ''
    const isBlankCorrect = submitted === correct
    return isBlankCorrect ? 'text-success' : 'text-error'
  }

  const getLabelColorClass = (index: number) => {
    if (!isResult) return 'text-foreground'
    const submitted = answers[index] ?? ''
    const correct = correctAnswer?.[index] ?? ''
    const isBlankCorrect = submitted === correct
    return isBlankCorrect ? 'text-[#14C786]' : 'text-[#F85402]'
  }

  const renderPromptWithBlanks = () => {
    if (!question.prompt) return null

    const parts = question.prompt.split('__')
    const result: React.ReactNode[] = []

    parts.forEach((part, index) => {
      result.push(<span key={`text-${index}`}>{part}</span>)
      if (index < blankCount) {
        result.push(
          <span key={`blank-${index}`} className="font-bold">
            ({blankLabels[index]})_______
          </span>
        )
      }
    })

    return (
      <div className="whitespace-pre-wrap text-foreground-secondary text-[16px] font-normal">
        {result}
      </div>
    )
  }

  const containerClass = isResult ? 'mb-[100px]' : 'mb-20'

  return (
    <div className={containerClass}>
      {/* 문제 헤더 */}
      <QuestionHeader
        number={question.number}
        title={question.question}
        point={question.point}
        typeLabel="빈칸식"
      />

      {/* 지문 박스 */}
      {question.prompt && (
        <div className="mb-[26px] ml-6 min-h-[96px] w-[648px] rounded-lg bg-surface/50 p-[20px]">
          {renderPromptWithBlanks()}
        </div>
      )}

      {/* 답변 입력 영역 */}
      <div className="ml-6 space-y-3">
        {blankLabels.map((label, index) => (
          <div
            key={label}
            className="relative flex h-[48px] w-[308px] items-center rounded-[4px] bg-surface px-4 py-2"
          >
            <span className={`text-[16px] font-bold mr-2 ${getLabelColorClass(index)}`}>
              {label}
            </span>
            <input
              type="text"
              value={answers[index] || ''}
              onChange={(e) => handleInputChange(index, e.target.value)}
              placeholder={isResult ? '' : '정답을 입력해 주세요.'}
              readOnly={isResult}
              className={`flex-1 h-full border-none bg-transparent outline-none text-[16px] font-bold placeholder:text-[16px] placeholder:font-normal placeholder:text-mono-400 ${getBlankColorClass(index)}`}
            />
          </div>
        ))}
      </div>

      {isResult && explanation && (
        <div className="mt-5 ml-6">
          <QuizResultExplanation explanation={explanation} isCorrect={isCorrect} />
        </div>
      )}
    </div>
  )
}
