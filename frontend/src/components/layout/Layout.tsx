import TopBar from './TopBar'
import { ReactNode } from 'react'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'

export default function Layout({children}:{children:ReactNode}){
  return (
    <div className="app-layout">
      <Sidebar />
      <TopBar />
      <main className="main-content">{children}</main>
      <BottomNav />
    </div>
  )
}
