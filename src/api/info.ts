import { apiClient } from './client'
import type { CourseEnrollment } from '@/types/info'

export async function getMyCourses(): Promise<CourseEnrollment[]> {
  const { data } = await apiClient.get<CourseEnrollment[]>(
    '/api/v1/accounts/me/enrolled-courses/'
  )
  return data
}

export type WithdrawPayload = {
  reason: string
  reason_detail: string
}

export async function withdraw(payload: WithdrawPayload) {
  await apiClient.delete('/api/v1/accounts/withdrawal/', {
    data: payload,
  })
}
