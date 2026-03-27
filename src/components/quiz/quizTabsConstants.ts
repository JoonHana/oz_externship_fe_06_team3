type TabKey = 'all' | 'done' | 'todo'

export const Tabs: {
  key: TabKey
  label: string
  status: 'all' | 'done' | 'pending'
}[] = [
  { key: 'all', label: '전체보기', status: 'all' },
  { key: 'done', label: '응시완료', status: 'done' },
  { key: 'todo', label: '미응시', status: 'pending' },
]
