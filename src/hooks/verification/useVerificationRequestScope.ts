import { useCallback, useEffect, useRef } from 'react'

type UseVerificationRequestScopeOptions = {
  identity: string
  enabled: boolean
}

export function useVerificationRequestScope({
  identity,
  enabled,
}: UseVerificationRequestScopeOptions) {
  const prevIdentityRef = useRef(identity)
  const latestIdentityRef = useRef(identity)
  const latestEnabledRef = useRef(enabled)

  useEffect(() => {
    latestIdentityRef.current = identity
  }, [identity])

  useEffect(() => {
    latestEnabledRef.current = enabled
  }, [enabled])

  const isCurrentRequest = useCallback((requestedIdentity: string) => {
    return (
      latestEnabledRef.current &&
      latestIdentityRef.current === requestedIdentity
    )
  }, [])

  return {
    prevIdentityRef,
    isCurrentRequest,
  }
}
