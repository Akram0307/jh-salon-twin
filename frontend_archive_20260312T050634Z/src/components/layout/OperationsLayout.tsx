import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import DashboardHeader from './DashboardHeader'
import { glass, semantic, component } from '../../lib/design-tokens';

type NavItem = {
  label: string
  to: string
  icon: React.ComponentType<{ className?: string }>
  aliases?: string[]
}

type OperationsLayoutProps = {
  roleLabel: string
  roleTitle: string
  homePath: string
  navItems: NavItem[]
  children: ReactNode
  title?: string
  subtitle?: string
  actions?: ReactNode
}

function matchesPath(pathname: string, target: string) {
  return pathname === target || pathname.startsWith(target + '/')
}

function isActive(pathname: string, item: NavItem) {
  if (matchesPath(pathname, item.to)) return true
  return (item.aliases ?? []).some((alias) => matchesPath(pathname, alias))
}

function OperationsLayout({
  roleLabel,
  roleTitle,
  homePath,
  navItems,
  children,
  title,
  subtitle,
  actions,
}: OperationsLayoutProps) {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto flex min-h-screen max-w-screen-2xl flex-col lg:flex-row">
        <aside className="hidden w-72 shrink-0 border-r semantic.border.default bg-zinc-900/70 backdrop-blur-lg lg:flex lg:flex-col">
          <div className="border-b semantic.border.default px-6 py-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl glass.default ring-1 ring-white/15">
                <Sparkles className="h-5 w-5 text-emerald-300" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-zinc-400">SalonOS</p>
                <h1 className="text-lg font-semibold text-white">{roleTitle}</h1>
              </div>
            </div>
          </div>

          <nav className="flex-1 px-4 py-5">
            <div className="space-y-1.5">
              {navItems.map((item) => {
                const Icon = item.icon
                const active = isActive(location.pathname, item)
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={[
                      'flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition',
                      active
                        ? 'bg-emerald-400/15 text-white ring-1 ring-emerald-300/20'
                        : 'text-zinc-400 hover:glass.subtle hover:text-white',
                    ].join(' ')}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </nav>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <DashboardHeader />
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            <div className="mx-auto w-full max-w-7xl rounded-[28px] border semantic.border.default bg-zinc-900/70 p-6 backdrop-blur-lg">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

export { OperationsLayout }

export default OperationsLayout
