import type { User } from '@/types/auth'
import { unmapGender } from '@/utils/gender'
import { useState } from 'react'
import { WithdrawalReasonModal } from '../common'
import { withdraw } from '@/api/info'
import type { CourseEnrollment } from '@/types/info'
import { WITHDRAW_REASON_MAP } from '@/constants/withdrawReason'
import type { WithdrawalReasonFormData } from '@/schemas/modalSchemas'
type Props = {
  user: User
  courses: CourseEnrollment[]
}

export function ViewMyInfo({ user, courses }: Props) {
  const gender = unmapGender(user.gender)
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false)

  /* ================= 회원 탈퇴 ================= */

  const handleWithdraw = async (
    data: WithdrawalReasonFormData
  ): Promise<void> => {
    try {
      const reason = WITHDRAW_REASON_MAP[data.reason]

      const reasonDetail =
        data.reason === 'other'
          ? data.otherReason?.trim()
          : data.feedback?.trim()

      await withdraw({
        reason,
        reason_detail: reasonDetail || '선택 안함',
      })

      alert('회원 탈퇴가 완료되었습니다.')
    } catch (error) {
      console.error(error)
    }
  }
  return (
    <>
      {/* ================= 프로필 / 개인 정보 ================= */}
      <div className="info-border mt-[20px] w-[747px]">
        <InfoSection title="프로필">
          <div className="flex justify-center">
            <img
              src={
                user.profile_img_url ? user.profile_img_url : '/프로필 사진.svg'
              }
              alt="프로필 사진"
              className="mb-[52px] h-[184px] rounded-full"
            />
          </div>

          <div className="mb-[90px] flex flex-col gap-[20px]">
            <InfoRow label="닉네임" value={user.nickname} />
            <InfoRow label="이메일" value={user.email} />
          </div>
        </InfoSection>

        <InfoSection title="개인 정보">
          <div className="flex flex-col gap-[20px]">
            <InfoRow label="이름" value={user.name} />
            <InfoRow label="휴대전화" value={user.phone_number} />
            <InfoRow label="성별" value={gender === 'male' ? '남자' : '여자'} />
            <InfoRow label="생년월일" value={user.birthday} />
          </div>
        </InfoSection>
      </div>
      {/* ================= 수강중 / 수강완료 과정 ================= */}
      <div className="info-border mt-[20px] w-[747px]">
        <p className="text-primary title-l-b">수강중인 과정</p>
        <hr className="border-mono-400 mt-[16px] mb-[40px]" />

        {courses.length === 0 ? (
          <p className="text-mono-400">현재 수강 중인 과정이 없습니다.</p>
        ) : (
          <div className="flex flex-col gap-[24px]">
            {courses.map((item) => (
              <div
                key={`${item.course.id}-${item.cohort.id}`}
                className="flex justify-between"
              >
                <div className="flex flex-col justify-center">
                  <p className="text-mono-400 placeholder-a mb-[10px]">
                    {item.course.tag} • {item.cohort.status}
                  </p>
                  <p className="text-mono-900">
                    {item.course.name} &lt; {item.cohort.number}기 &gt;
                  </p>
                </div>

                {/* 썸네일 */}
                {item.course.thumbnail_img_url ? (
                  <img
                    src={item.course.thumbnail_img_url}
                    alt="과정 썸네일"
                    className="h-[102px] w-[152px] rounded-[8px] object-cover"
                  />
                ) : (
                  <div className="bg-mono-200 h-[102px] w-[152px] rounded-[8px]" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      {/* ================= 회원 탈퇴 ================= */}
      <div className="my-[48px] flex h-[147px] items-center justify-between">
        <div className="flex w-[365px] flex-col">
          <p className="text-mono-600 text-[20px]">회원탈퇴 안내</p>
          <p className="text-mono-400 placeholder-a mt-[20px] text-[13px] leading-[18px]">
            탈퇴 처리 시, 수강 기간 / 포인트 / 쿠폰은 소멸되며 환불되지
            않습니다. 필요한 경우, 반드시 탈퇴 전에 문의 바랍니다.
          </p>
        </div>

        <button
          className="flex-center border-mono-250 bg-mono-200 h-[48px] w-[142px] rounded-[4px] border"
          onClick={() => setIsWithdrawModalOpen(true)}
        >
          회원 탈퇴하기
        </button>
      </div>

      {/* ================= 회원 탈퇴 사유 모달 ================= */}
      <WithdrawalReasonModal
        isOpen={isWithdrawModalOpen}
        onClose={() => setIsWithdrawModalOpen(false)}
        onSuccess={handleWithdraw}
      />
    </>
  )
}

/* ===== sub ===== */

function InfoSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section>
      <p className="text-primary title-l-b">{title}</p>
      <hr className="border-mono-400 mt-[16px] mb-[40px]" />
      {children}
    </section>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center">
      <p className="infoText w-[120px] shrink-0">{label}</p>
      <p className="text-mono-900">{value}</p>
    </div>
  )
}
