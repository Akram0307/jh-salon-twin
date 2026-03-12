import { ReactNode } from 'react'
import { CalendarDays, ClipboardList, Home, UserCircle2 } from 'lucide-react'
import OperationsLayout from '../../components/layout/OperationsLayout'

const navItems = [
  { label: 'Today', to: '/staff/today', icon: Home, aliases: ['/staff'] },
  { label: 'Schedule', to: '/staff/schedule', icon: CalendarDays },
  { label: 'Clients', to: '/staff/clients', icon: UserCircle2 },
  { label: 'Tasks', to: '/staff/tasks', icon: ClipboardList },
]

export default function StaffLayout({
  children,
  title,
  subtitle,
}: {
  children: ReactNode
  title: string
  subtitle: string
}) {
  return (
    <OperationsLayout
      roleLabel="Staff"
      roleTitle="Staff Mission Control"
      homePath="/staff/today"
      navItems={navItems}
      title={title}
      subtitle={subtitle}
    >
      {children}
    </OperationsLayout>
  )
}
