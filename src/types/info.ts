export type CourseEnrollment = {
  cohort: {
    id: number
    number: number
    start_date: string
    end_date: string
    status: 'ONGOING' | 'COMPLETED' | 'DROPPED' | string
  }
  course: {
    id: number
    name: string
    tag: string
    thumbnail_img_url: string
  }
}

/** 과정 리스트 조회 응답 항목 (GET /api/v1/course/) */
export type Course = {
  id: number
  name: string
  tag: string
  thumbnail_img_url: string
}

/** 기수 리스트 조회 응답 항목 (GET /api/v1/:course_id/cohorts) */
export type Cohort = {
  id: number
  course_id: number
  number: number
  status: 'PREPARING' | 'IN_PROGRESS' | 'FINISHED'
}

export type ApiErrorResponse = {
  error_detail: string
}
