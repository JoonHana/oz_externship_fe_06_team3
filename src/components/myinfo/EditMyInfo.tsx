import { Button, CommonInput } from '../common'
import type { User } from '@/types/auth'
import { unmapGender } from '@/utils/gender'
import { useMyInfoStore } from '@/store/myInfoStore'
import { checkNickname, sendSmsVerification, verifySmsCode } from '@/api/auth'
import { useCountdown } from '@/hooks/useCountdown'

type GenderUI = 'male' | 'female'

type Props = {
  user: User
}

export function EditMyInfo({ user }: Props) {
  const {
    nickname,
    nicknameStatus,
    phone,
    phoneStatus,
    smsCode,
    smsStatus,
    phoneChanging,
    error,
    setField,
  } = useMyInfoStore()
  const { isActive, startTimer, resetTimer, formatTime, isExpired } =
    useCountdown(5) // 5분

  const handleChange = (key: 'nickname' | 'phone', value: string) => {
    setField(key, value)
    if (key === 'nickname') {
      setField('nicknameStatus', 'default')
      setField('error', null)
    }
    if (key === 'phone') {
      setField('phoneStatus', 'default')
      setField('smsToken', null)
      setField('smsCode', '')
      setField('error', null)
      resetTimer()
    }
  }

  const handleCheckNickname = async () => {
    if (!nickname.trim()) return
    if (nickname.length > 10) {
      setField('nicknameStatus', 'error')
      setField('error', '닉네임은 최대 10자까지 입력 가능합니다.')
      return
    }
    if (!/^[가-힣a-zA-Z0-9]*$/.test(nickname)) {
      setField('nicknameStatus', 'error')
      setField('error', '닉네임은 한글, 영문, 숫자만 입력 가능합니다.')
      return
    }
    if (nickname === user.nickname) {
      setField('nicknameStatus', 'success')
      setField('error', null)
      return
    }
    try {
      await checkNickname({ nickname })
      setField('nicknameStatus', 'success')
      setField('error', null)
    } catch (error: any) {
      if (error.response?.status === 409) {
        setField('nicknameStatus', 'error')
        setField('error', '이미 사용중인 닉네임 입니다.')
      } else if (error.response?.status === 400) {
        const errorData = error.response?.data
        if (errorData?.error_detail?.nickname) {
          setField('nicknameStatus', 'error')
          setField('error', errorData.error_detail.nickname[0])
        } else {
          setField('nicknameStatus', 'error')
          setField('error', '잘못된 요청입니다.')
        }
      } else {
        setField('nicknameStatus', 'error')
        setField('error', '닉네임 확인 중 오류가 발생했습니다.')
      }
    }
  }

  const handleSendSms = async () => {
    if (!phone.trim()) return
    if (!/^\d+$/.test(phone)) {
      setField('phoneStatus', 'error')
      setField('error', '휴대전화 번호는 숫자만 입력 가능합니다.')
      return
    }
    try {
      await sendSmsVerification({ phoneNumber: phone })
      setField('phoneChanging', true)
      setField('phoneStatus', 'default')
      setField('error', null)
      startTimer()
    } catch (error) {
      setField('phoneStatus', 'error')
      setField('error', '인증 코드 발송에 실패했습니다.')
    }
  }

  const handleVerifySms = async () => {
    if (!smsCode.trim()) return
    if (isExpired) {
      setField('phoneStatus', 'error')
      setField('error', '인증번호 전송 시간이 초과되었습니다. 재전송 해주세요.')
      return
    }
    try {
      const result = await verifySmsCode({
        phoneNumber: phone,
        verificationCode: smsCode,
      })
      setField('smsToken', result.smsToken)
      setField('phoneStatus', 'success')
      setField('error', null)
      resetTimer()
      setField('smsStatus', 'success')
    } catch (error) {
      setField('phoneStatus', 'error')
      setField('error', '인증번호가 일치하지 않습니다.')
      setField('smsStatus', 'error')
    }
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
        <div className="flex flex-col gap-2">
          <div className="flex gap-[12px]">
            <CommonInput
              value={nickname}
              onChange={(v) => {
                if (v.length <= 10) {
                  handleChange('nickname', v)
                }
              }}
              width={532}
              placeholder={user.nickname}
              state={nicknameStatus}
              autoComplete="off"
            />
            <Button size="sm" variant="secondary" onClick={handleCheckNickname}>
              중복확인
            </Button>
          </div>
          <div className="h-[22px]">
            {nicknameStatus === 'error' && error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
            {nicknameStatus === 'success' && (
              <p className="text-sm text-green-500">
                사용 가능한 닉네임입니다.
              </p>
            )}
          </div>
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
        {!phoneChanging ? (
          <div className="flex gap-[12px]">
            <CommonInput
              value={phone || user.phone_number}
              locked
              width={532}
              disabled
              onChange={() => {}}
            />
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setField('phoneChanging', true)
                setField('smsCode', '') // 인증번호 입력값 초기화
                setField('smsStatus', 'default') // 인증번호 입력 상태 초기화
                setField('phoneStatus', 'default') // 인증 상태 초기화
                setField('smsToken', null)
                setField('error', null)
              }}
            >
              변경
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex gap-[12px]">
              <CommonInput
                value={phone}
                onChange={(v) => {
                  if (/^\d*$/.test(v)) {
                    handleChange('phone', v)
                  }
                }}
                width={502}
                placeholder="휴대전화 번호를 입력하세요"
                autoComplete="off"
              />
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  handleSendSms()
                  setField('smsCode', '') // 인증번호 입력값 초기화
                  setField('smsStatus', 'default') // 인증번호 입력 상태 초기화
                  setField('phoneStatus', 'default') // 인증 상태 초기화
                  setField('smsToken', null)
                  setField('error', null)
                }}
                disabled={!phone.trim()}
                className="w-[142px]"
              >
                {isActive ? '재전송' : '인증번호 받기'}
              </Button>
            </div>
            {(isActive || phoneStatus === 'success') && (
              <div className="flex items-center gap-[12px]">
                <div className="relative">
                  <CommonInput
                    value={smsCode}
                    onChange={(v) => {
                      if (/^\d{0,6}$/.test(v)) {
                        setField('smsCode', v)
                        setField('smsStatus', 'default')
                      }
                    }}
                    width={502}
                    placeholder="6자리 인증번호를 입력하세요"
                    disabled={phoneStatus === 'success'}
                    state={
                      phoneStatus === 'success'
                        ? 'success'
                        : smsStatus === 'error'
                          ? 'error'
                          : 'default'
                    }
                    autoComplete="off"
                  />
                  {phoneStatus === 'success' ? (
                    <span className="absolute top-1/2 right-3 -translate-y-1/2 transform text-green-500">
                      ✓
                    </span>
                  ) : (
                    <span className="absolute top-1/2 right-3 -translate-y-1/2 transform text-sm text-red-500">
                      {formatTime}
                    </span>
                  )}
                </div>
                <Button
                  size="sm"
                  variant={phoneStatus === 'success' ? 'disabled' : 'secondary'}
                  onClick={handleVerifySms}
                  disabled={phoneStatus === 'success'}
                  className="w-[142px]"
                >
                  인증번호 확인
                </Button>
              </div>
            )}
            {phoneStatus === 'error' && error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
          </div>
        )}

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
          autoComplete="off"
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
