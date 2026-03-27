interface QuestionHeaderProps {
  number: number
  title: string
  point: number
  typeLabel: string
}

export default function QuestionHeader({
  number,
  title,
  point,
  typeLabel,
}: QuestionHeaderProps) {
  return (
    <div className="quiz-header">
      <span className="quiz-header-title">
        {number}. {title}
      </span>
      <span className="quiz-header-badge">{point}점</span>
      <span className="quiz-header-badge">{typeLabel}</span>
    </div>
  )
}

