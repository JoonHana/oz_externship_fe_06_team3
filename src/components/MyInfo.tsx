import { useEffect, useState } from 'react'
import { Button } from './common'
import Skeleton from './common/Skeleton'
import { ViewMyInfo } from './myinfo/ViewMyInfo'
import { EditMyInfo } from './myinfo/EditMyInfo'
import { useAuthStore } from '@/store/authStore'
import { me } from '@/api/auth'
import { getMyCourses } from '@/api/info'
import { updateMyInfo } from '@/api/auth'
import { patchProfileImage } from '@/api/profileImage'
import { useMyInfoStore } from '@/store/myInfoStore'

export default function MyInfo() {
  const [isEdit, setIsEdit] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const { user, setAuth, accessToken, refreshToken } = useAuthStore()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userData] = await Promise.all([me(), getMyCourses()])
        setAuth({ accessToken, refreshToken, user: userData })
      } catch (e) {
        console.error('내 정보 조회 실패', e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [setAuth])

  const handleSave = async () => {
    if (!user) return
    const { nickname, phone, nicknameStatus, phoneStatus, error } =
      useMyInfoStore.getState()
    const canPatch =
      nicknameStatus === 'success' ||
      phoneStatus === 'success' ||
      !!selectedImage
    if (!canPatch) {
      if (error) {
        alert(error)
        return
      }
      setIsEdit(false)
      return
    }
    let newProfileImgUrl = user.profile_img_url
    if (selectedImage) {
      const result = await patchProfileImage(selectedImage)
      if (result.ok && result.img_url) {
        newProfileImgUrl = result.img_url
      }
    }
    try {
      const updated = await updateMyInfo({
        nickname: nicknameStatus === 'success' ? nickname : user.nickname,
        phone_number: phoneStatus === 'success' ? phone : user.phone_number,
      })
      setAuth({
        accessToken,
        refreshToken,
        user: { ...updated, profile_img_url: newProfileImgUrl },
      })
      setIsEdit(false)
      setSelectedImage(null)
    } catch (e) {
      console.error('내 정보 저장 실패', e)
    }
  }

  const handleEdit = () => {
    useMyInfoStore.getState().reset()
    setIsEdit(true)
  }

  if (loading)
    return (
      <div className="flex w-[744px] flex-col gap-[24px]">
        {/* InfoSection: 프로필 스켈레톤 */}
        <div className="flex w-[744px] items-center justify-between">
          <Skeleton className="h-[32px] w-[120px]" />
          <Skeleton className="h-[40px] w-[100px] rounded-[8px]" />
        </div>
        <div className="info-border mt-[20px] w-[747px]">
          <section>
            <div className="mb-[16px]">
              <Skeleton className="mb-[8px] h-[28px] w-[56px]" />
              <hr className="border-mono-400 mt-[8px] mb-[40px]" />
            </div>
            <div className="flex justify-center">
              <Skeleton className="mb-[52px] h-[184px] w-[184px] rounded-full" />
            </div>
            <div className="mb-[90px] flex flex-col gap-[20px]">
              <Skeleton className="h-[24px] w-[200px]" />
              <Skeleton className="h-[24px] w-[300px]" />
            </div>
            <div className="flex flex-col gap-[20px]">
              <Skeleton className="h-[24px] w-[120px]" />
              <Skeleton className="h-[24px] w-[200px]" />
              <Skeleton className="h-[24px] w-[120px]" />
              <Skeleton className="h-[24px] w-[120px]" />
            </div>
          </section>
        </div>
        <div className="my-[48px] flex h-[147px] items-center justify-between">
          <div className="flex w-[365px] flex-col">
            <Skeleton className="mb-[20px] h-[28px] w-[200px]" />
            <Skeleton className="mb-[8px] h-[18px] w-[300px]" />
            <Skeleton className="h-[18px] w-[250px]" />
          </div>
          <Skeleton className="h-[48px] w-[142px] rounded-[4px]" />
        </div>
      </div>
    )
  if (!user) return <div>정보를 불러올 수 없습니다.</div>

  return (
    <>
      <div className="mb-[32px] flex w-[744px] items-center justify-between">
        <div className="title-xl">내 정보</div>
        <Button
          size="md"
          onClick={() => (isEdit ? handleSave() : handleEdit())}
        >
          {isEdit ? '저장하기' : '수정하기'}
        </Button>
      </div>

      {isEdit ? (
        <EditMyInfo user={user} setSelectedImage={setSelectedImage} />
      ) : (
        <>
          <ViewMyInfo />
        </>
      )}
    </>
  )
}
