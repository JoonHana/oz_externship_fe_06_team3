import cn from '@/lib/cn'

interface SkeletonProps {
  className?: string
}

export default function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn('animate-pulse rounded bg-[#E8E8E8]', className)}
      aria-hidden
    />
  )
}
