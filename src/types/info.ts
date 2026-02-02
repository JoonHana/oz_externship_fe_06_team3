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
export type ApiErrorResponse = {
  error_detail: string
}
