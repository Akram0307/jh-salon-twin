import DashboardHeader from './DashboardHeader'
import { ReactNode } from 'react'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'

export default function Layout({children}:{children:ReactNode}){
  return (
    <div className="app-layout min-h-screen bg-zinc-950 text-white transition-all duration-500 ease-in-out">
      <Sidebar />
      <div className="flex flex-col flex-1 transition-all duration-500 ease-in-out">
        <DashboardHeader />
        <main className="main-content p-4 sm:p-6 lg:p-8 transition-all duration-500 ease-in-out">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  )
}
