import { Outlet } from 'react-router-dom'
import { Sidebar, MobileNav, MobileTopBar } from './Sidebar'

export function AppLayout() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex min-h-screen flex-1 flex-col overflow-auto pb-20 lg:pb-0">
        <MobileTopBar />
        <div className="mx-auto w-full max-w-7xl p-4 md:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
      <MobileNav />
    </div>
  )
}
