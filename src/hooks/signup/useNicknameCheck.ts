// 닉네임 중복 확인 - checkNickname API 호출
import { useCallback, useEffect, useMemo, useState } from 'react'
import { type FlowMessage, IDLE_FLOW_MESSAGE } from '@/utils/formMessage'
import { AUTH_MESSAGES } from '@/constants/authMessages'
import { NICKNAME_REGEX } from '@/schemas/auth'
import * as authApi from '@/api/auth'
import { mapCheckNicknameError } from '@/utils/error/authEndpointErrorMapper'
import type { Status } from '@/hooks/useVerificationFlow'

export type UseNicknameCheckParams = {
  nickname: string
  busy: boolean
  trigger: (name: 'nickname') => Promise<boolean>
  clearErrors: (name: 'nickname') => void
  setError: (name: 'nickname', options: { message: string }) => void
  setRootError: (message: string | null) => void
  setBusy: (isBusy: boolean) => void
}

export type UseNicknameCheckResult = {
  nicknameChecked: boolean
  nicknameStatus: Status
  nicknameFlowMessage: FlowMessage
  canCheckNickname: boolean
  onCheckNickname: () => Promise<void>
}

export function useNicknameCheck({
  nickname,
  busy,
  trigger,
  clearErrors,
  setError,
  setRootError,
  setBusy,
}: UseNicknameCheckParams): UseNicknameCheckResult {
  const [nicknameChecked, setNicknameChecked] = useState(false)
  const [nicknameStatus, setNicknameStatus] = useState<Status>('idle')
  const [nicknameFlowMessage, setNicknameFlowMessage] =
    useState<FlowMessage>(IDLE_FLOW_MESSAGE)

  useEffect(() => {
    setNicknameChecked(false)
    setNicknameStatus('idle')
    setNicknameFlowMessage(IDLE_FLOW_MESSAGE)
  }, [nickname])

  const onCheckNickname = useCallback(async () => {
    setRootError(null)
    const isValid = await trigger('nickname')
    if (!isValid) return

    clearErrors('nickname')
    setBusy(true)

    try {
      await authApi.checkNickname({ nickname })
      setNicknameChecked(true)
      setNicknameStatus('success')
      setNicknameFlowMessage({
        type: 'success',
        message: AUTH_MESSAGES.nickname.available,
        scope: null,
      })
    } catch (error) {
      setNicknameChecked(false)
      setNicknameFlowMessage(IDLE_FLOW_MESSAGE)
      const mappedError = mapCheckNicknameError(error)
      setNicknameStatus('error')
      setError('nickname', { message: mappedError.message })
    } finally {
      setBusy(false)
    }
  }, [
    nickname,
    trigger,
    clearErrors,
    setError,
    setRootError,
    setBusy,
  ])

  const canCheckNickname = useMemo(
    () => !busy && !nicknameChecked && NICKNAME_REGEX.test(nickname),
    [busy, nicknameChecked, nickname]
  )

  return {
    nicknameChecked,
    nicknameStatus,
    nicknameFlowMessage,
    canCheckNickname,
    onCheckNickname,
  }
}
