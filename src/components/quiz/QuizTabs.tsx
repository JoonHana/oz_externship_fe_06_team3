import clsx from 'clsx'
import { Tabs } from './quizTabsConstants'

export { Tabs }
export type TabKey = 'all' | 'done' | 'todo'

interface QuizTabsProps {
  currentTab: TabKey
  onTabChange: (tab: TabKey) => void
}

export default function QuizTabs({ currentTab, onTabChange }: QuizTabsProps) {
  const getTabClass = (tabKey: TabKey) =>
    clsx(
      'pb-3 transition-colors title-l-b',
      currentTab === tabKey
        ? 'text-[#721AE3] border-b-[3px] border-[#721AE3]'
        : 'text-[#9D9D9D]'
    )

  return (
    <div className="flex gap-10 border-b-2 border-[#E5E5E5]">
      {Tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          className={getTabClass(tab.key)}
          aria-pressed={currentTab === tab.key}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
