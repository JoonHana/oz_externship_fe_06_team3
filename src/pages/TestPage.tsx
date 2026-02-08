import { useState } from 'react'
import {
  FindIdResultModal,
  ResetPasswordModal,
  WithdrawnMemberModal,
  RegisterStudentModal,
  WithdrawalReasonModal,
  StartQuizModal,
  CheatingWarningModal,
  QuizEndModal,
  Button,
} from '@/components/common'
import {
  FindIdModal,
  EmailVerificationModal,
} from '@/components/common/Modal/auth'

function TestPage() {
  // 각 모달의 열림 상태 관리
  const [findIdOpen, setFindIdOpen] = useState(false)
  const [findIdResultOpen, setFindIdResultOpen] = useState(false)
  const [maskedEmail, setMaskedEmail] = useState<string>('')
  const [findPasswordOpen, setFindPasswordOpen] = useState(false)
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false)
  const [emailToken, setEmailToken] = useState<string | null>(null)
  const [withdrawnMemberOpen, setWithdrawnMemberOpen] = useState(false)
  const [registerStudentOpen, setRegisterStudentOpen] = useState(false)
  const [withdrawalReasonOpen, setWithdrawalReasonOpen] = useState(false)
  const [startQuizOpen, setStartQuizOpen] = useState(false)
  const [cheatingWarning1Open, setCheatingWarning1Open] = useState(false)
  const [cheatingWarning2Open, setCheatingWarning2Open] = useState(false)
  const [cheatingWarning3Open, setCheatingWarning3Open] = useState(false)
  const [quizEndOpen, setQuizEndOpen] = useState(false)

  return (
    <div className="space-y-4 p-8">
      <h1 className="title-xl mb-8">모달 테스트 페이지</h1>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {/* 1. 아이디 찾기 */}
        <Button variant="primary" size="lg" onClick={() => setFindIdOpen(true)}>
          아이디 찾기
        </Button>

        {/* 2. 아이디 확인 결과 */}
        <Button
          variant="primary"
          size="lg"
          onClick={() => setFindIdResultOpen(true)}
        >
          아이디 확인 결과
        </Button>

        {/* 3. 비밀번호 찾기 */}
        <Button
          variant="primary"
          size="lg"
          onClick={() => setFindPasswordOpen(true)}
        >
          비밀번호 찾기
        </Button>

        {/* 4. 비밀번호 재설정 */}
        <Button
          variant="primary"
          size="lg"
          onClick={() => setResetPasswordOpen(true)}
        >
          비밀번호 재설정
        </Button>

        {/* 5. 탈퇴회원 안내 */}
        <Button
          variant="primary"
          size="lg"
          onClick={() => setWithdrawnMemberOpen(true)}
        >
          탈퇴회원 안내
        </Button>

        {/* 6. 수강생 등록 */}
        <Button
          variant="primary"
          size="lg"
          onClick={() => setRegisterStudentOpen(true)}
        >
          수강생 등록
        </Button>

        {/* 7. 회원 탈퇴 사유 */}
        <Button
          variant="primary"
          size="lg"
          onClick={() => setWithdrawalReasonOpen(true)}
        >
          회원 탈퇴 사유
        </Button>

        {/* 8. 쪽지시험 시작 */}
        <Button
          variant="primary"
          size="lg"
          onClick={() => setStartQuizOpen(true)}
        >
          쪽지시험 시작
        </Button>

        {/* 9. 부정행위 1차 경고 */}
        <Button
          variant="primary"
          size="lg"
          onClick={() => setCheatingWarning1Open(true)}
        >
          부정행위 1차 경고
        </Button>

        {/* 10. 부정행위 2차 경고 */}
        <Button
          variant="primary"
          size="lg"
          onClick={() => setCheatingWarning2Open(true)}
        >
          부정행위 2차 경고
        </Button>

        {/* 11. 부정행위 3차 경고 */}
        <Button
          variant="primary"
          size="lg"
          onClick={() => setCheatingWarning3Open(true)}
        >
          부정행위 3차 경고
        </Button>

        {/* 12. 시험 종료(관리자) */}
        <Button
          variant="primary"
          size="lg"
          onClick={() => setQuizEndOpen(true)}
        >
          상태 관리 시험 종료
        </Button>
      </div>

      {/* 모달들 */}
      <FindIdModal
        isOpen={findIdOpen}
        onClose={() => setFindIdOpen(false)}
        onFindIdSuccess={(result) => {
          setMaskedEmail(result)
          setFindIdOpen(false)
          setFindIdResultOpen(true)
        }}
      />

      <FindIdResultModal
        isOpen={findIdResultOpen}
        onClose={() => setFindIdResultOpen(false)}
        maskedEmail={maskedEmail || 'test@example.com'}
        onFindPasswordClick={() => {
          setFindIdResultOpen(false)
          setFindPasswordOpen(true)
        }}
      />

      <EmailVerificationModal
        isOpen={findPasswordOpen}
        onClose={() => setFindPasswordOpen(false)}
        onVerified={(payload) => {
          setFindPasswordOpen(false)
          setEmailToken(payload.emailToken)
          setResetPasswordOpen(true)
        }}
      />

      <ResetPasswordModal
        isOpen={resetPasswordOpen}
        onClose={() => {
          setResetPasswordOpen(false)
          setEmailToken(null) // emailToken 1회 사용 후 삭제, 모달 닫을 때 초기화
        }}
        initialToken={emailToken}
      />

      <WithdrawnMemberModal
        isOpen={withdrawnMemberOpen}
        onClose={() => setWithdrawnMemberOpen(false)}
        onRestoreAccount={() => {
          setWithdrawnMemberOpen(false)
        }}
      />

      <RegisterStudentModal
        isOpen={registerStudentOpen}
        onClose={() => setRegisterStudentOpen(false)}
      />

      <WithdrawalReasonModal
        isOpen={withdrawalReasonOpen}
        onClose={() => setWithdrawalReasonOpen(false)}
        onSuccess={() => {
          setWithdrawalReasonOpen(false)
        }}
      />

      <StartQuizModal
        isOpen={startQuizOpen}
        onClose={() => setStartQuizOpen(false)}
        onSuccess={() => {
          setStartQuizOpen(false)
        }}
        // 테스트 페이지용 더미 데이터 (실제 화면에서는 QuizCard에서 전달)
        deploymentId={101}
        imageUrl="/icons/Course/React.svg"
        subjectName="React"
        quizName="React 기초 쪽지시험"
        questionCount={10}
        timeLimit={30}
      />

      <CheatingWarningModal
        isOpen={cheatingWarning1Open}
        onClose={() => setCheatingWarning1Open(false)}
        warningLevel={1}
        onConfirm={() => {}}
      />

      <CheatingWarningModal
        isOpen={cheatingWarning2Open}
        onClose={() => setCheatingWarning2Open(false)}
        warningLevel={2}
        onConfirm={() => {}}
      />

      <CheatingWarningModal
        isOpen={cheatingWarning3Open}
        onClose={() => setCheatingWarning3Open(false)}
        warningLevel={3}
        onConfirm={() => {}}
      />

      <QuizEndModal
        isOpen={quizEndOpen}
        onClose={() => setQuizEndOpen(false)}
        onConfirm={() => {
          console.log('시험 종료 확인')
          setQuizEndOpen(false)
        }}
      />
    </div>
  )
}

export default TestPage
