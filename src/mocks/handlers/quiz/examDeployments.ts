import { http, HttpResponse, delay } from 'msw'
import examDeployments from '@/mocks/data/examDeployments.json'

const PAGE_SIZE = 10
/** 스켈레톤 UI 확인용 지연(ms). 확인 후 0으로 변경하거나 이 줄 삭제 */
const SKELETON_DEMO_DELAY = 3000

export const examDeploymentsHandler = http.get('/api/v1/exams/deployments', async ({ request }) => {
  if (SKELETON_DEMO_DELAY > 0) await delay(SKELETON_DEMO_DELAY)//
  //스켈레톤 UI 확인용 지연(ms). 확인 후 0으로 변경하거나 이 줄 삭제

  const url = new URL(request.url)
  const pageParam = url.searchParams.get('page')
  const statusParam = url.searchParams.get('status') ?? 'all'
  const page = pageParam ? Number(pageParam) : 1

  const filtered = examDeployments.filter((item) => {
    if (statusParam === 'done') return item.exam_info.status === 'done'
    if (statusParam === 'pending') return item.exam_info.status === 'pending'
    return true
  })

  const startIndex = (page - 1) * PAGE_SIZE
  const endIndex = startIndex + PAGE_SIZE
  const results = filtered.slice(startIndex, endIndex)
  const hasNext = endIndex < filtered.length

  return HttpResponse.json({
    page,
    has_next: hasNext,
    results,
  })
})
