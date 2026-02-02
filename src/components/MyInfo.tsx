import { useEffect, useState } from 'react'
import { Button } from './common'
import { ViewMyInfo } from './myinfo/ViewMyInfo'
import { EditMyInfo } from './myinfo/EditMyInfo'
import type { User } from '@/types/auth'
import type { CourseEnrollment } from '@/types/info'
import { me } from '@/api/auth'
import { getMyCourses } from '@/api/info'

export default function MyInfo() {
  const [isEdit, setIsEdit] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [courses, setCourses] = useState<CourseEnrollment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userData, courseData] = await Promise.all([me(), getMyCourses()])
        setUser(userData)
        setCourses(courseData)
      } catch (e) {
        console.error('내 정보 조회 실패', e)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleSave = async () => {
    if (!user) return
    try {
      // await updateMyInfo(user)
      setIsEdit(false)
    } catch (e) {
      console.error('내 정보 저장 실패', e)
    }
  }

  if (loading) return <div>로딩중...</div>
  if (!user) return <div>정보를 불러올 수 없습니다.</div>

  return (
    <>
      <div className="flex w-[744px] items-center justify-between">
        <div className="title-xl">내 정보</div>
        <Button
          size="md"
          onClick={() => (isEdit ? handleSave() : setIsEdit(true))}
        >
          {isEdit ? '저장하기' : '수정하기'}
        </Button>
      </div>

      {isEdit ? (
        <EditMyInfo user={user} onChange={setUser} />
      ) : (
        <>
          <ViewMyInfo user={user} courses={courses} />
        </>
      )}
    </>
  )
}
