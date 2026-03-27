// 이메일 인증 코드 발송 성공 시 표시하는 토스트 (EmailVerificationModal에서 사용)
export function EmailVerificationToast() {
  return (
    <div className="flex h-12 w-[248px] items-center gap-2 rounded-lg bg-[#FAFAFA] px-3 shadow-sm">
      <div className="bg-success-500 flex size-6 flex-shrink-0 items-center justify-center rounded-full">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <path
            d="M5 12l5 5 9-14"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <p className="text-[14px] leading-[24px] font-normal text-[#4D4D4D]">
        전송 완료! 이메일을 확인해주세요.
      </p>
    </div>
  )
}
