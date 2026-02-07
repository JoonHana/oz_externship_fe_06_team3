import { useEffect, useState } from 'react'
import { getQuizVerifiedKey } from '@/constants/quiz'

/**
 * 참가코드 검증 여부 확인. 미검증 시 모달 표시용 플래그 반환(호출처에서 InvalidAccessModal 표시).
 */
export function useQuizAccessCheck(
  deploymentId: string | undefined,
  deploymentIdNumber: number
) {
  const [isAccessAllowed, setIsAccessAllowed] = useState<boolean | null>(null)
  const [showInvalidAccessModal, setShowInvalidAccessModal] = useState(false)

  useEffect(() => {
    const hasValidDeployment = deploymentId && deploymentIdNumber > 0
    const isVerified =
      hasValidDeployment &&
      sessionStorage.getItem(getQuizVerifiedKey(deploymentIdNumber))

    if (!isVerified) {
      setShowInvalidAccessModal(true)
      return
    }
    setIsAccessAllowed(true)
  }, [deploymentId, deploymentIdNumber])

  return { isAccessAllowed, showInvalidAccessModal }
}
