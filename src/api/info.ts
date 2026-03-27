import { apiClient } from './client'
import type { CourseEnrollment, Course, Cohort } from '@/types/info'

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

export async function fetchCourses(): Promise<Course[]> {
  const { data } = await apiClient.get<Course[]>('/api/v1/course/')
  return data
}

/** 기수 리스트 조회 (GET /api/v1/:course_id/cohorts) */
export async function fetchCohorts(courseId: number): Promise<Cohort[]> {
  const { data } = await apiClient.get<Cohort[]>(
    `/api/v1/${courseId}/cohorts`
  )
  return data
}

export async function enrollStudent(cohortId: number): Promise<{ detail: string }> {
  const { data } = await apiClient.post<{ detail: string }>(
    '/api/v1/accounts/enroll-student/',
    { cohort_id: cohortId }
  )
  return data
}