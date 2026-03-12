import { ReactNode } from 'react'
import { CalendarDays, CreditCard, Home, Users } from 'lucide-react'
import OperationsLayout from '../../components/layout/OperationsLayout'

const navItems = [
  { label: 'Dashboard', to: '/frontdesk/dashboard', icon: Home, aliases: ['/frontdesk'] },
  { label: 'Queue', to: '/frontdesk/queue', icon: CalendarDays },
  { label: 'Clients', to: '/frontdesk/clients', icon: Users },
  { label: 'POS', to: '/frontdesk/pos', icon: CreditCard },
]

export default function FrontdeskLayout({
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
      roleLabel="Frontdesk"
      roleTitle="Frontdesk Manager"
      homePath="/frontdesk/dashboard"
      navItems={navItems}
      title={title}
      subtitle={subtitle}
    >
      {children}
    </OperationsLayout>
  )
}
