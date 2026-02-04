import { create } from 'zustand'
import type { CourseEnrollment } from '@/types/info'

interface CoursesState {
  courses: CourseEnrollment[]
  loading: boolean
  error: string | null
  setCourses: (courses: CourseEnrollment[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useCoursesStore = create<CoursesState>((set) => ({
  courses: [],
  loading: false,
  error: null,
  setCourses: (courses) => set({ courses }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}))
