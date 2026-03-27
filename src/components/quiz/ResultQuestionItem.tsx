import type { ExamDeploymentDetailResult } from '@/mappers/examDeploymentDetail'
import type { ExamSubmissionResult } from '@/mappers/examSubmissionResult'
import SingleChoice from './SingleChoice'
import MultipleChoice from './MultipleChoice'
import OX from './OX'
import FillBlank from './FillBlank'
import Ordering from './Ordering'
import ShortAnswer from './ShortAnswer'

type ResultQuestion = ExamSubmissionResult['questions'][0]
type QuizQuestion = ExamDeploymentDetailResult['questions'][0]

/** 결과 API 문항 타입 → 내부 타입 (자식 컴포넌트용) */
const RESULT_API_TYPE_TO_INTERNAL: Record<string, string> = {
  SINGLE_CHOICE: 'single_choice',
  MULTI_SELECT: 'multiple_choice',
  OX: 'ox',
  SHORT_ANSWER: 'short_answer',
  FILL_IN_BLANK: 'fill_blank',
  ORDERING: 'ordering',
}

/** API가 snake_case(single_choice) 또는 대문자(SINGLE_CHOICE)로 올 수 있음 → switch용 통일 타입 */
const SNAKE_TO_SWITCH_TYPE: Record<string, string> = {
  single_choice: 'SINGLE_CHOICE',
  multiple_choice: 'MULTI_SELECT',
  ox: 'OX',
  short_answer: 'SHORT_ANSWER',
  fill_blank: 'FILL_IN_BLANK',
  ordering: 'ORDERING',
  SINGLE_CHOICE: 'SINGLE_CHOICE',
  MULTI_SELECT: 'MULTI_SELECT',
  OX: 'OX',
  SHORT_ANSWER: 'SHORT_ANSWER',
  FILL_IN_BLANK: 'FILL_IN_BLANK',
  ORDERING: 'ORDERING',
}

function toInternalType(apiType: string): QuizQuestion['type'] {
  return (RESULT_API_TYPE_TO_INTERNAL[apiType] ?? apiType) as QuizQuestion['type']
}

function normalizeResultType(type: string): string {
  return SNAKE_TO_SWITCH_TYPE[type] ?? type
}

interface ResultQuestionItemProps {
  question: ResultQuestion
  index: number
}

function mapResultQuestionToQuizQuestion(
  question: ResultQuestion,
  index: number
): QuizQuestion {
  return {
    questionId: question.id,
    number: index + 1,
    type: toInternalType(question.type),
    question: question.question,
    point: question.point,
    prompt: question.prompt,
    blankCount: question.blankCount,
    options: question.options,
    answerInput: null,
  }
}

/**
 * 결과 페이지용 문항 1개 렌더링. 타입에 따라 SingleChoice/MultipleChoice/... 표시.
 */
export default function ResultQuestionItem({ question, index }: ResultQuestionItemProps) {
  const mapped = mapResultQuestionToQuizQuestion(question, index)
  const submitted = question.submittedAnswer
  const noop = () => {}
  const normalizedType = normalizeResultType(question.type ?? '')

  switch (normalizedType) {
    case 'SINGLE_CHOICE':
      return (
        <SingleChoice
          question={mapped}
          answer={(submitted?.[0] ?? null) as string | null}
          onAnswerChange={noop}
          isResult
          correctAnswer={(question.answer?.[0] ?? null) as string | null}
          isCorrect={question.isCorrect}
          explanation={question.explanation}
        />
      )
    case 'MULTI_SELECT':
      return (
        <MultipleChoice
          question={mapped}
          answer={(submitted ?? null) as string[] | null}
          onAnswerChange={noop}
          isResult
          correctAnswer={(question.answer ?? null) as string[] | null}
          isCorrect={question.isCorrect}
          explanation={question.explanation}
        />
      )
    case 'SHORT_ANSWER':
      return (
        <ShortAnswer
          question={mapped}
          answer={(submitted?.[0] ?? '') as string}
          onAnswerChange={noop}
          isResult
          isCorrect={question.isCorrect}
          explanation={question.explanation}
        />
      )
    case 'OX':
      return (
        <OX
          question={mapped}
          answer={(submitted?.[0] ?? null) as string | null}
          onAnswerChange={noop}
          isResult
          correctAnswer={(question.answer?.[0] ?? null) as string | null}
          isCorrect={question.isCorrect}
          explanation={question.explanation}
        />
      )
    case 'FILL_IN_BLANK':
      return (
        <FillBlank
          question={mapped}
          answer={(submitted ?? null) as string[] | null}
          onAnswerChange={noop}
          isResult
          correctAnswer={(question.answer ?? null) as string[] | null}
          isCorrect={question.isCorrect}
          explanation={question.explanation}
        />
      )
    case 'ORDERING':
      return (
        <Ordering
          question={mapped}
          answer={(submitted ?? null) as string[] | null}
          onAnswerChange={noop}
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
