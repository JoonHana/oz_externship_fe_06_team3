import { useEffect, useState } from 'react'
import type { ExamDeploymentDetailResult } from '@/mappers/examDeploymentDetail'
import { Modal } from '@/components/common'
import QuizResultExplanation from './QuizResultExplanation'
import QuestionHeader from './QuestionHeader'

const SHORT_ANSWER_MAX_LENGTH = 20
const OVERFLOW_MODAL_AUTO_CLOSE_MS = 3000

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
  const [showOverflowModal, setShowOverflowModal] = useState(false)

  useEffect(() => {
    if (!showOverflowModal) return
    const timer = window.setTimeout(() => setShowOverflowModal(false), OVERFLOW_MODAL_AUTO_CLOSE_MS)
    return () => window.clearTimeout(timer)
  }, [showOverflowModal])

  const handleChange = (value: string) => {
    if (isResult) {
      onAnswerChange(question.questionId, value)
      return
    }
    if (value.length > SHORT_ANSWER_MAX_LENGTH) {
      setShowOverflowModal(true)
      onAnswerChange(question.questionId, value.slice(0, SHORT_ANSWER_MAX_LENGTH))
    } else {
      onAnswerChange(question.questionId, value)
    }
  }

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
          onChange={(e) => handleChange(e.target.value)}
          placeholder="20글자 이내로 입력해 주세요."
          className={`h-[48px] w-[648px] rounded-lg bg-surface px-4 py-[10px] text-[16px] font-normal ${answerColorClass} placeholder:text-mono-400`}
        />
      </div>

      {!isResult && (
        <Modal isOpen={showOverflowModal} onClose={() => setShowOverflowModal(false)}>
          <Modal.Body>
            <p className="py-4 text-center text-[16px] text-foreground-secondary">
              단답형 문항은 20글자 미만으로 작성하세요
            </p>
          </Modal.Body>
        </Modal>
      )}
      {isResult && explanation && (
        <div className="mt-5 ml-8">
          <QuizResultExplanation explanation={explanation} isCorrect={isCorrect} />
        </div>
      )}
    </div>
  )
}
