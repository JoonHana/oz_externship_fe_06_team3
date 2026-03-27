import { useState, useEffect, useRef, useMemo } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  useDraggable,
  useDroppable,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/components/common/Button'
import type { ExamDeploymentDetailResult } from '@/mappers/examDeploymentDetail'
import QuizResultExplanation from './QuizResultExplanation'
import QuestionHeader from './QuestionHeader'

interface OrderingProps {
  question: ExamDeploymentDetailResult['questions'][0]
  answer: string[] | null
  onAnswerChange: (questionId: number, answer: string[]) => void
  isResult?: boolean
  correctAnswer?: string[] | null
  isCorrect?: boolean
  explanation?: string | null
}

const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] as const

// 슬롯 초기화 헬퍼 함수
function initializeSlots(
  options: string[],
  answer: string[] | null,
  optionLabels: readonly string[]
): (string | null)[] {
  const slots = Array(options.length).fill(null)
  if (answer && answer.length > 0) {
    answer.forEach((item, idx) => {
      if (idx < slots.length) {
        const index = options.findIndex((opt) => opt === item)
        if (index !== -1) {
          slots[idx] = optionLabels[index]
        }
      }
    })
  }
  return slots
}

interface DraggableLabelProps {
  id: string
  label: string
  item: string
  isUsed: boolean
  isResult?: boolean
}

function DraggableLabel({
  id,
  label,
  item,
  isUsed,
  isResult,
}: DraggableLabelProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id,
      disabled: isUsed || isResult,
      data: { item, label },
    })

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : isUsed ? 0.4 : 1,
    padding: '3px',
  }

  return (
    <span
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-[4px] bg-primary-100 text-primary text-[18px] font-normal ${
        isUsed || isResult
          ? 'cursor-not-allowed'
          : 'cursor-grab active:cursor-grabbing'
      }`}
    >
      {label}
    </span>
  )
}

/** 슬롯 안에 들어간 라벨(드래그 가능, 슬롯 간 맞바꾸기용) */
interface DraggableSlotLabelProps {
  slotIndex: number
  label: string
  onRemove: () => void
  isResult?: boolean
  isSlotCorrect?: boolean
}

function DraggableSlotLabel({
  slotIndex,
  label,
  onRemove,
  isResult,
  isSlotCorrect,
}: DraggableSlotLabelProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `slot-label-${slotIndex}`,
      disabled: !!isResult,
      data: { label, slotIndex },
    })

  const getLabelInnerClass = () => {
    if (!isResult || isSlotCorrect === undefined) {
      return 'text-primary bg-primary-100 text-[18px] font-normal w-8 h-8 flex items-center justify-center rounded-[4px]'
    }
    return isSlotCorrect
      ? 'text-success text-[20px] font-bold bg-surface w-10 h-10 flex items-center justify-center rounded-[4px]'
      : 'text-warning text-[20px] font-bold bg-surface w-10 h-10 flex items-center justify-center rounded-[4px]'
  }

  const style = transform
    ? { transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.5 : 1 }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative flex h-full w-full items-center justify-center"
    >
      {!isResult && (
        <Button
          type="button"
          variant="link"
          size="auto"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="absolute -top-1 -right-1 z-10 flex h-4 w-4 min-w-0 items-center justify-center rounded-full border border-gray-300 bg-white p-0 text-xs text-gray-400 hover:text-gray-600 hover:no-underline"
          aria-label="제거"
        >
          ×
        </Button>
      )}
      <span
        className={`${getLabelInnerClass()} ${!isResult ? 'cursor-grab active:cursor-grabbing' : ''}`}
        {...(isResult ? {} : { ...listeners, ...attributes })}
      >
        {label}
      </span>
    </div>
  )
}

interface DroppableSlotProps {
  id: string
  index: number
  label: string | null
  onRemove: () => void
  isResult?: boolean
  isSlotCorrect?: boolean
}

function DroppableSlot({
  id,
  index,
  label,
  onRemove,
  isResult,
  isSlotCorrect,
}: DroppableSlotProps) {
  const { setNodeRef, isOver } = useDroppable({ id, disabled: isResult })

  const slotBorderClass =
    !isResult && isOver ? 'ring-2 ring-primary ring-offset-2' : ''

  const getLabelInnerClass = () => {
    if (!isResult || isSlotCorrect === undefined) {
      return 'text-primary bg-primary-100 text-[18px] font-normal w-8 h-8 flex items-center justify-center rounded-[4px]'
    }
    return isSlotCorrect
      ? 'text-success text-[20px] font-bold bg-surface w-10 h-10 flex items-center justify-center rounded-[4px]'
      : 'text-warning text-[20px] font-bold bg-surface w-10 h-10 flex items-center justify-center rounded-[4px]'
  }

  return (
    <div
      ref={setNodeRef}
      className={`flex h-[62px] w-[62px] items-center justify-center rounded-[4px] bg-surface p-[3px] transition-colors ${slotBorderClass}`}
    >
      {label ? (
        isResult ? (
          <div className="relative flex h-full w-full items-center justify-center">
            <span className={getLabelInnerClass()}>{label}</span>
          </div>
        ) : (
          <DraggableSlotLabel
            slotIndex={index}
            label={label}
            onRemove={onRemove}
            isResult={isResult}
            isSlotCorrect={isSlotCorrect}
          />
        )
      ) : (
        <span className="text-surface text-sm font-medium">{index + 1}</span>
      )}
    </div>
  )
}

export default function Ordering({
  question,
  answer,
  onAnswerChange,
  isResult = false,
  correctAnswer = null,
  isCorrect = false,
  explanation = null,
}: OrderingProps) {
  const options = useMemo(() => question.options || [], [question.options])
  const optionLabels = useMemo(
    () => OPTION_LABELS.slice(0, options.length),
    [options.length]
  )

  const [slots, setSlots] = useState<(string | null)[]>(() =>
    initializeSlots(options, answer, optionLabels)
  )

  // 부모에서 넘긴 answer와 동기화. 우리가 방금 보낸 답안과 같으면 슬롯 덮어쓰지 않음(중간 제거 시 나머지 슬롯 자리 유지).
  const prevSyncKey = useRef<string | null>(null)
  const lastSentAnswerRef = useRef<string | null>(null)
  useEffect(() => {
    const syncKey = `${question.questionId}:${options.length}:${JSON.stringify(answer)}`
    if (prevSyncKey.current === syncKey) return
    prevSyncKey.current = syncKey
    if (lastSentAnswerRef.current !== null && lastSentAnswerRef.current === JSON.stringify(answer)) {
      lastSentAnswerRef.current = null
      return
    }
    lastSentAnswerRef.current = null
    setSlots(initializeSlots(options, answer, optionLabels))
  }, [question.questionId, answer, options, optionLabels])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: isResult ? 9999 : 5 },
    }),
    useSensor(KeyboardSensor)
  )

  const convertLabelsToAnswers = (labels: (string | null)[]): string[] => {
    return labels
      .filter((label): label is string => label !== null)
      .map((label) => {
        const labelIndex = optionLabels.findIndex((l) => l === label)
        return labelIndex !== -1 ? options[labelIndex] : ''
      })
      .filter((val) => val !== '')
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return

    const overId = over.id as string
    if (!overId.startsWith('slot-')) return
    const slotIndex = parseInt(overId.replace('slot-', ''), 10)
    if (Number.isNaN(slotIndex) || slotIndex < 0 || slotIndex >= slots.length)
      return

    const activeId = active.id as string
    let draggedLabel: string
    let sourceSlotIndex: number

    if (activeId.startsWith('slot-label-')) {
      sourceSlotIndex = parseInt(activeId.replace('slot-label-', ''), 10)
      draggedLabel = slots[sourceSlotIndex] ?? ''
    } else {
      draggedLabel = activeId.replace('label-', '')
      sourceSlotIndex = slots.findIndex((label) => label === draggedLabel)
    }

    if (!draggedLabel) return

    const newSlots = [...slots]
    const targetLabel = newSlots[slotIndex]

    if (sourceSlotIndex !== -1) {
      newSlots[sourceSlotIndex] = targetLabel
    } else if (targetLabel !== null) {
      const firstEmpty = newSlots.findIndex((l) => l === null)
      if (firstEmpty !== -1) newSlots[firstEmpty] = targetLabel
    }
    newSlots[slotIndex] = draggedLabel

    const nextAnswer = convertLabelsToAnswers(newSlots)
    lastSentAnswerRef.current = JSON.stringify(nextAnswer)
    setSlots(newSlots)
    onAnswerChange(question.questionId, nextAnswer)
  }

  const handleRemoveFromSlot = (index: number) => {
    const newSlots = [...slots]
    newSlots[index] = null
    const nextAnswer = convertLabelsToAnswers(newSlots)
    lastSentAnswerRef.current = JSON.stringify(nextAnswer)
    setSlots(newSlots)
    onAnswerChange(question.questionId, nextAnswer)
  }

  const isLabelUsed = (label: string) => slots.includes(label)

  const getSlotCorrectness = (index: number): boolean | undefined => {
    if (!isResult || !correctAnswer || correctAnswer.length === 0)
      return undefined
    const submittedOrder = convertLabelsToAnswers(slots)
    return submittedOrder[index] === correctAnswer[index]
  }

  const renderOptions = () => (
    <div className="space-y-[18px]">
      {options.map((item, index) => (
        <div key={`option-${index}`} className="flex items-center gap-3">
          <DraggableLabel
            id={`label-${optionLabels[index]}`}
            label={optionLabels[index]}
            item={item}
            isUsed={isLabelUsed(optionLabels[index])}
            isResult={isResult}
          />
          <span className="text-foreground-secondary text-[16px] font-normal">{item}</span>
        </div>
      ))}
    </div>
  )

  const containerClass = isResult ? 'mb-[100px]' : 'mb-20'

  return (
    <div className={containerClass}>
      {/* 문제 헤더 */}
      <QuestionHeader
        number={question.number}
        title={question.question}
        point={question.point}
        typeLabel="순서배열"
      />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        {/* 옵션 박스 */}
        {options.length > 0 && (
          <div className="mb-4 ml-6 min-h-[228px] w-[648px] rounded-lg bg-surface/50 p-[20px]">
            {renderOptions()}
          </div>
        )}

        {/* 빈칸 영역 */}
        <div className="mt-4 ml-6">
          <div className="flex gap-[10px]">
            {slots.map((label, index) => (
              <DroppableSlot
                key={`slot-${index}`}
                id={`slot-${index}`}
                index={index}
                label={label}
                onRemove={() => handleRemoveFromSlot(index)}
                isResult={isResult}
                isSlotCorrect={getSlotCorrectness(index)}
              />
            ))}
          </div>
        </div>
      </DndContext>

      {isResult && explanation && (
        <div className="mt-5 ml-6">
          <QuizResultExplanation
            explanation={explanation}
            isCorrect={isCorrect}
          />
        </div>
      )}
    </div>
  )
}
