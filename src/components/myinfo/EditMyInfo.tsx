import { Button, CommonInput } from '../common'
import type { User } from '@/types/auth'
import { unmapGender } from '@/utils/gender'

type GenderUI = 'male' | 'female'

type Props = {
  user: User
  onChange: (v: User) => void
}

export function EditMyInfo({ user, onChange }: Props) {
  const handleChange = <K extends keyof User>(key: K, value: User[K]) => {
    onChange({ ...user, [key]: value })
  }

  const currentGender = unmapGender(user.gender)

  return (
    <div className="info-border mt-[20px] w-[747px]">
      <Section title="프로필 수정">
        <div className="flex justify-center">
          <img
            src={
              user.profile_img_url ? user.profile_img_url : '/프로필 사진.svg'
            }
            alt="프로필 사진"
            className="mb-[52px] h-[184px] rounded-full"
          />
        </div>

        <Label>닉네임</Label>
        <div className="flex gap-[12px]">
          <CommonInput
            value={user.nickname}
            onChange={(v) => handleChange('nickname', v)}
            width={532}
          />
          <Button size="sm" variant="secondary">
            중복확인
          </Button>
        </div>

        <Label>이메일</Label>
        <CommonInput
          value={user.email}
          locked
          width={656}
          onChange={() => {}}
          disabled
        />
      </Section>

      <Section title="개인 정보 수정">
        <Label>휴대전화</Label>
        <CommonInput
          value={user.phone_number}
          onChange={(v) => handleChange('phone_number', v)}
          width={656}
        />

        <Label>성별</Label>
        <div className="flex gap-[20px]">
          {(['male', 'female'] as GenderUI[]).map((g) => (
            <Button
              key={g}
              size="xxs"
              rounded="full"
              variant={currentGender === g ? 'secondary' : 'disabled'}
              onClick={() => {}}
            >
              {g === 'male' ? '남성' : '여성'}
            </Button>
          ))}
        </div>

        <Label>생년월일</Label>
        <CommonInput
          value={user.birthday}
          locked
          width={656}
          onChange={() => {}}
          disabled
        />
      </Section>
    </div>
  )
}

/* ===== sub ===== */

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="mb-[80px]">
      <p className="text-primary title-l">{title}</p>
      <hr className="border-mono-400 mt-[16px] mb-[40px]" />
      <div className="flex flex-col gap-[15px]">{children}</div>
    </section>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="mt-[10px]">{children}</p>
}
