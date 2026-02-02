import type { CourseEnrollment } from '@/types/info'

type Props = {
  courses: CourseEnrollment[]
}

export function EnrolledCourses({ courses }: Props) {
  return (
    <div className="info-border mt-[20px] w-[747px]">
      <p className="text-primary title-l-b">수강중인 과정</p>
      <hr className="border-mono-400 mt-[16px] mb-[40px]" />

      {courses.length === 0 ? (
        <p className="text-mono-400">수강 중인 과정이 없습니다.</p>
      ) : (
        courses.map(({ cohort, course }) => (
          <div key={cohort.id} className="mb-[24px] flex justify-between">
            <div className="flex flex-col justify-center">
              <p className="text-mono-400 placeholder-a mb-[10px]">
                {cohort.number}기 • {course.tag}
              </p>
              <p className="text-mono-900">{course.name}</p>
            </div>

            <img
              src={course.thumbnail_img_url}
              alt={course.name}
              className="h-[102px] w-[152px] rounded-[8px] object-cover"
            />
          </div>
        ))
      )}
    </div>
  )
}
