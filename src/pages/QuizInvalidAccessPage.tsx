import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { InvalidAccessModal } from '@/components/common'
import {
  INVALID_ACCESS_AUTO_REDIRECT_MS,
  QUIZ_LIST_PATH,
} from '@/constants/quiz'

export default function QuizInvalidAccessPage() {
  const navigate = useNavigate()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleConfirm = () => {
    navigate(QUIZ_LIST_PATH, { replace: true })
  }

  if (!mounted) return null

  return (
    <InvalidAccessModal
      isOpen
      onConfirm={handleConfirm}
      autoRedirectMs={INVALID_ACCESS_AUTO_REDIRECT_MS}
    />
  )
}
