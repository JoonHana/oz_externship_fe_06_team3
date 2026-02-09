/** 결과 조회 API 응답 (서버가 snake_case + 대문자 type 사용) */
export interface ExamSubmissionResultResponse {
  id: number
  submitter_id: number
  deployment_id: number
  exam: {
    id: number
    title: string
    thumbnail_img_url: string
  }
  questions: Array<{
    id: number
    question: string
    prompt: string | null
    blank_count: number
    options: string[]
    type: string
    answer: string[]
    point: number
    explanation: string
    is_correct: boolean
    submitted_answer: string[]
  }>
  cheating_count: number
  total_score: number
  correct_answer_count: number
  elapsed_time: number
  started_at: string
  submitted_at: string
}

export interface ExamSubmissionResult {
  id: number
  submitterId: number
  deploymentId: number
  exam: {
    id: number
    title: string
    thumbnailImgUrl: string
  }
  questions: Array<{
    id: number
    question: string
    prompt: string
    blankCount: number
    options: string[]
    type: string
    answer: string[]
    point: number
    explanation: string
    isCorrect: boolean
    submittedAnswer: string[]
  }>
  cheatingCount: number
  totalScore: number
  correctAnswerCount: number
  elapsedTime: number
  startedAt: string
  submittedAt: string
}

export const mapExamSubmissionResult = (
  response: ExamSubmissionResultResponse
): ExamSubmissionResult => {
  const questions = response.questions ?? []
  const exam = response.exam
  return {
    id: response.id,
    submitterId: response.submitter_id,
    deploymentId: response.deployment_id,
    exam: {
      id: exam?.id ?? 0,
      title: exam?.title ?? '',
      thumbnailImgUrl: exam?.thumbnail_img_url ?? '',
    },
    questions: questions.map((q) => ({
      id: q.id,
      question: q.question ?? '',
      prompt: q.prompt ?? '',
      blankCount: q.blank_count ?? 0,
      options: Array.isArray(q.options) ? q.options : [],
      type: q.type ?? '',
      answer: Array.isArray(q.answer) ? q.answer : [],
      point: q.point ?? 0,
      explanation: q.explanation ?? '',
      isCorrect: q.is_correct ?? false,
      submittedAnswer: Array.isArray(q.submitted_answer) ? q.submitted_answer : [],
    })),
    cheatingCount: response.cheating_count ?? 0,
    totalScore: response.total_score ?? 0,
    correctAnswerCount: response.correct_answer_count ?? 0,
    elapsedTime: response.elapsed_time ?? 0,
    startedAt: response.started_at ?? '',
    submittedAt: response.submitted_at ?? '',
  }
}
