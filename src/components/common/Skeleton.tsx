import cn from '@/lib/cn'

interface SkeletonProps {
  className?: string
}

export default function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn('animate-pulse rounded bg-[#E8E8E8]', className)}
      aria-hidden
      // animate-pulse: 회색 블록이 살짝 깜빡이면서 “데이터 로딩 중”이라는 느낌의 애니메이션
      //aria-hidden: 스켈레톤 요소는 시각적으로 숨겨져 있지만, 스크린 리더가 읽지 않도록 함
    />
  )
}
