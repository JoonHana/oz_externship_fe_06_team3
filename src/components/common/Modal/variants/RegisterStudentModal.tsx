import { useEffect } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Button } from '@/components/common/Button'
import Dropdown from '@/components/common/Dropdown'
import { Modal } from '@/components/common/Modal'
import {
  registerStudentSchema,
  type RegisterStudentFormData,
} from '@/schemas/modalSchemas'
import { fetchCourses, fetchCohorts, enrollStudent } from '@/api/info'
import axios from 'axios'

interface RegisterStudentModalProps {
  isOpen: boolean
  onClose: () => void
}

export function RegisterStudentModal({
  isOpen,
  onClose,
}: RegisterStudentModalProps) {
  const methods = useForm<RegisterStudentFormData>({
    resolver: zodResolver(registerStudentSchema),
    defaultValues: {
      course: '',
      batch: '',
    },
  })

  const courseValue = methods.watch('course')
  const batchValue = methods.watch('batch')

  // 과정 리스트 (모달 열릴 때만) / 기수는 과정 선택 시 해당 과정의 기수 목록 조회
  const { data: courses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: fetchCourses,
    enabled: isOpen,
  })

  const selectedCourseId = courseValue ? Number(courseValue) : null
  const { data: cohorts = [] } = useQuery({
    queryKey: ['cohorts', selectedCourseId],
    queryFn: () => {
      if (!selectedCourseId) throw new Error('과정을 선택해주세요.')
      return fetchCohorts(selectedCourseId)
    },
    enabled: isOpen && selectedCourseId != null,
  })

  const enrollMutation = useMutation({
    mutationFn: enrollStudent,
    onSuccess: onClose,
  })

  // 과정 옵션: API 과정 목록
  const courseOptions = courses.map((c) => ({
    label: c.name, 
    value: String(c.id),
  }))

  const batchOptions = cohorts.map((c) => ({
    label: `${c.number}기`,
    value: String(c.id),
  }))

  useEffect(() => {
    methods.setValue('batch', '')
    // courseValue 변경 시에만 기수 초기화 (methods 의존 시 매 렌더마다 실행 방지)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseValue])

  useEffect(() => {
    if (!isOpen) {
      methods.reset()
      enrollMutation.reset()
    }
    // isOpen만 의존 (methods, enrollMutation 포함 시 불필요한 리셋 방지)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  const onSubmit = (data: RegisterStudentFormData) => {
    enrollMutation.mutate(Number(data.batch))
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="min-w-[396px] min-h-[410px]"
    >
      <Modal.Header>
        <div className="flex flex-col items-center gap-2">
          <img
            src="/icons/RegisterStudent.svg"
            alt="내 과정 선택하기"
            style={{ width: '35px', height: '25px' }}
          />
          <h2 className="title-l-b">내 과정 선택하기</h2>
          <p
            className="text-center"
            style={{
              fontSize: '14px',
              fontWeight: 'normal',
              color: '#4D4D4D',
            }}
          >
            해당하는 과정과 기수를 선택해 주세요.
          </p>
        </div>
      </Modal.Header>

      <Modal.Body>
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-4">
            <Modal.InputRow label="">
              <div className="w-full">
                <Dropdown
                  options={courseOptions}
                  value={courseValue}
                  onChange={(value) => methods.setValue('course', value)}
                  placeholder="과정을 선택해주세요"
                  renderListInPortal
                />
              </div>
              {methods.formState.errors.course && (
                <p className="text-error mt-1 text-sm">
                  {methods.formState.errors.course.message}
                </p>
              )}
            </Modal.InputRow>

            <Modal.InputRow label="">
              <div className="w-full">
                <Dropdown
                  options={batchOptions}
                  value={batchValue}
                  onChange={(value) => methods.setValue('batch', value)}
                  placeholder="기수를 선택해주세요"
                  disabled={!courseValue}
                  renderListInPortal
                />
              </div>
              {methods.formState.errors.batch && (
                <p className="text-error mt-1 text-sm">
                  {methods.formState.errors.batch.message}
                </p>
              )}
            </Modal.InputRow>

            {enrollMutation.isError && (
              <p className="text-sm text-red-500">
                {axios.isAxiosError(enrollMutation.error) &&
                enrollMutation.error.response?.status === 403
                  ? '*등록 신청에 실패했습니다. 이미 해당 기수에 등록 신청하였습니다.'
                  : '등록 신청에 실패했습니다. 다시 시도해 주세요.'}
              </p>
            )}
            <div className="pt-4">
              <Button
                type="submit"
                variant="primary"
                size="xl"
                className="w-full"
                disabled={enrollMutation.isPending}
              >
                {enrollMutation.isPending ? '등록 중...' : '등록신청'}
              </Button>
            </div>
          </form>
        </FormProvider>
      </Modal.Body>
    </Modal>
  )
}
