import { useState, useMemo } from 'react'
import { useExamDeploymentsInfiniteQuery } from '@/hooks/useQuiz'
import QuizTabs, { Tabs } from '@/components/quiz/QuizTabs'
import QuizContent from '@/components/quiz/QuizContent'

type TabKey = 'all' | 'done' | 'todo'

const INITIAL_TAB: TabKey = 'all'
const PAGE_TITLE = '쪽지시험'
const TITLE_CLASS = 'title-xl text-[#121212] min-w-[744px] mb-8'
const CONTAINER_CLASS = 'space-y-6'

function getStatusFromTab(tab: TabKey): 'all' | 'done' | 'pending' {
  return Tabs.find((t) => t.key === tab)?.status ?? 'all'
}

function MyPageQuiz() {
  const [currentTab, setCurrentTab] = useState<TabKey>(INITIAL_TAB)
  const currentStatus = useMemo(() => getStatusFromTab(currentTab), [currentTab])

  const deploymentsQuery = useExamDeploymentsInfiniteQuery(currentStatus)
  const quizList = useMemo(
    () => deploymentsQuery.data?.pages.flatMap((p) => p.results) ?? [],
    [deploymentsQuery.data?.pages]
  )

  return (
    <div className={CONTAINER_CLASS}>
      <h1 className={TITLE_CLASS}>{PAGE_TITLE}</h1>
      <QuizTabs currentTab={currentTab} onTabChange={setCurrentTab} />
      <QuizContent
        quizzes={quizList}
        isLoading={deploymentsQuery.isLoading}
        isError={deploymentsQuery.isError}
        currentTab={currentTab}
        onLoadMore={deploymentsQuery.hasNextPage ? deploymentsQuery.fetchNextPage : undefined}
        isFetchingNextPage={deploymentsQuery.isFetchingNextPage}
      />
    </div>
  )
}

export default MyPageQuiz
