import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { QUIZ_LIST_PATH, getQuizVerifiedKey } from '@/constants/quiz'

const INVALID_ACCESS_MESSAGE =
  '접근할 수 없습니다. 쪽지시험 목록에서 참가코드를 입력한 후 응시해 주세요.'

/**
 * 참가코드 검증 여부 확인. 미검증 시 alert 후 목록으로 리다이렉트.
 */
export function useQuizAccessCheck(
  deploymentId: string | undefined,
  deploymentIdNumber: number
) {
  const navigate = useNavigate()
  const [isAccessAllowed, setIsAccessAllowed] = useState<boolean | null>(null)

  useEffect(() => {
    const hasValidDeployment = deploymentId && deploymentIdNumber > 0
    const isVerified =
      hasValidDeployment &&
      sessionStorage.getItem(getQuizVerifiedKey(deploymentIdNumber))

    if (!isVerified) {
      window.alert(INVALID_ACCESS_MESSAGE)
      navigate(QUIZ_LIST_PATH, { replace: true })
      return
    }
    setIsAccessAllowed(true)
  }, [deploymentId, deploymentIdNumber, navigate])

  return { isAccessAllowed }
}
