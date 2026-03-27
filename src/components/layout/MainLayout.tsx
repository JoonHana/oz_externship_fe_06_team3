import { Outlet } from 'react-router-dom'
import Header from '@/components/common/Header'
import Footer from '@/components/common/Footer'

export default function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col [--header-offset:100px]">
      <Header />
      <main className="flex-1 pt-[var(--header-offset)]">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
