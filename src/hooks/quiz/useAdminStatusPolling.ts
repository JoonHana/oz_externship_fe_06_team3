import { useEffect } from 'react'
import type { EndReason } from './useQuizSubmissionFlow'

/**
 * statusData가 closed / private / forceSubmit 이면 시험 종료(관리자) 처리.
 */
export function useAdminStatusPolling(
  statusData: { examStatus?: string; forceSubmit?: boolean } | undefined,
  isEnded: boolean,
  setIsEnded: (ended: boolean) => void,
  setEndReason: (reason: EndReason) => void
) {
  const isAdminEndedStatus =
    statusData?.forceSubmit === true ||
    statusData?.examStatus === 'closed' ||
    statusData?.examStatus === 'private'

  useEffect(() => {
    if (isEnded || !isAdminEndedStatus) return
    setIsEnded(true)
    setEndReason('status')
  }, [isAdminEndedStatus, isEnded, setIsEnded, setEndReason])
}
