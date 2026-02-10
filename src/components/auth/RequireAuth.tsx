import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Loading } from '@/components/common'
import { useAuthStore } from '@/store/authStore'

// 로그인이 필요한 페이지에 사용되는 컴포넌트, 로그인이 되어있지 않으면 로그인 페이지로 이동
type LocationState = {
  from?: string
}

export function RequireAuth() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const restore = useAuthStore((s) => s.restore)
  const location = useLocation()
  const [restoring, setRestoring] = useState(false)
  const [restoreAttempted, setRestoreAttempted] = useState(false)

  useEffect(() => {
    if (accessToken) return
    let cancelled = false
    setRestoring(true)
    // persist 복원이 끝날 시간을 주어, rehydration 전에 restore 실패 → clearAuth 되는 것 방지
    const timer = window.setTimeout(() => {
      if (cancelled) return
      restore()
        .finally(() => {
          if (!cancelled) {
            setRestoring(false)
            setRestoreAttempted(true)
          }
        })
    }, 50)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [accessToken, restore])

  if (accessToken) return <Outlet />

  if (restoring || !restoreAttempted) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loading />
      </div>
    )
  }

  const from = location.pathname + location.search
  return (
    <Navigate to="/login" replace state={{ from } satisfies LocationState} />
  )
}
