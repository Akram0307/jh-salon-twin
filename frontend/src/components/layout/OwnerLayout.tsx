import { ReactNode, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  BarChart3,
  CalendarDays,
  ChevronRight,
  Home,
  Menu,
  Settings,
  Sparkles,
  Users,
  Scissors,
  UserCircle2,
  X,
} from 'lucide-react'

type OwnerLayoutProps = {
  children: ReactNode
  title?: string
  subtitle?: string
  actions?: ReactNode
}

type NavItem = {
  label: string
  to: string
  icon: typeof Home
  aliases?: string[]
}

const primaryNav: NavItem[] = [
  { label: 'Dashboard', to: '/owner/dashboard', icon: Home, aliases: ['/owner'] },
  { label: 'Staff', to: '/owner/staff', icon: Users },
  { label: 'Services', to: '/owner/services', icon: Scissors },
  { label: 'Schedule', to: '/owner/schedule', icon: CalendarDays },
  { label: 'Clients', to: '/owner/clients', icon: UserCircle2 },
  { label: 'Reports', to: '/owner/reports', icon: BarChart3 },
  { label: 'Settings', to: '/owner/settings', icon: Settings },
]

const mobileNav = [
  primaryNav[0],
  primaryNav[1],
  primaryNav[2],
  primaryNav[3],
]

function matchesPath(pathname: string, target: string) {
  return pathname === target || pathname.startsWith(target + '/')
}

function isActive(pathname: string, item: NavItem) {
  if (matchesPath(pathname, item.to)) return true
  return (item.aliases ?? []).some((alias) => matchesPath(pathname, alias))
}

function prettifySegment(segment: string) {
  return segment
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export default function OwnerLayout({ children, title, subtitle, actions }: OwnerLayoutProps) {
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const ownerSegments = useMemo(() => location.pathname.split('/').filter(Boolean).slice(1), [location.pathname])

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto flex min-h-screen max-w-screen-2xl flex-col lg:flex-row">
        <aside className="hidden w-72 shrink-0 border-r border-white/10 bg-zinc-950/95 lg:flex lg:flex-col">
          <div className="border-b border-white/10 px-6 py-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
                <Sparkles className="h-5 w-5 text-emerald-300" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-zinc-400">SalonOS</p>
                <h1 className="text-lg font-semibold text-white">Owner Command</h1>
              </div>
            </div>
          </div>

          <nav className="flex-1 px-4 py-5">
            <p className="px-3 pb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">Navigation</p>
            <div className="space-y-1.5">
              {primaryNav.map((item) => {
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
                        : 'text-zinc-400 hover:bg-white/5 hover:text-white',
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
          <header className="sticky top-0 z-30 border-b border-white/10 bg-zinc-950/85 backdrop-blur">
            <div className="px-4 py-3 sm:px-6 lg:px-8 lg:py-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="mb-2 flex items-center justify-between gap-3 lg:block">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                      <Link to="/owner/dashboard" className="transition hover:text-zinc-300">Owner</Link>
                      {ownerSegments.map((segment, index) => {
                        const to = '/owner/' + ownerSegments.slice(0, index + 1).join('/')
                        const isLast = index === ownerSegments.length - 1
                        return (
                          <span key={to} className="flex items-center gap-2">
                            <ChevronRight className="h-3.5 w-3.5" />
                            {isLast ? (
                              <span className="text-zinc-300">{prettifySegment(segment)}</span>
                            ) : (
                              <Link to={to} className="transition hover:text-zinc-300">{prettifySegment(segment)}</Link>
                            )}
                          </span>
                        )
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={() => setMobileMenuOpen((v) => !v)}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-zinc-200 lg:hidden"
                      aria-label="Toggle owner navigation"
                    >
                      {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </button>
                  </div>

                  <div>
                    <h2 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">{title ?? 'Owner Portal'}</h2>
                    {subtitle ? <p className="mt-1 max-w-3xl text-sm text-zinc-400">{subtitle}</p> : null}
                  </div>
                </div>
                {actions ? <div className="shrink-0">{actions}</div> : null}
              </div>

              {mobileMenuOpen ? (
                <div className="mt-4 grid grid-cols-2 gap-2 rounded-3xl border border-white/10 bg-white/[0.03] p-2 lg:hidden">
                  {primaryNav.map((item) => {
                    const Icon = item.icon
                    const active = isActive(location.pathname, item)
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setMobileMenuOpen(false)}
                        className={[
                          'flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition',
                          active
                            ? 'bg-emerald-400/15 text-white ring-1 ring-emerald-300/20'
                            : 'text-zinc-400 hover:bg-white/5 hover:text-white',
                        ].join(' ')}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    )
                  })}
                </div>
              ) : null}
            </div>
          </header>

          <main className="flex-1 px-4 py-4 pb-24 sm:px-6 lg:px-8 lg:py-8 lg:pb-8">{children}</main>

          <nav className="sticky bottom-0 z-20 grid grid-cols-4 border-t border-white/10 bg-zinc-950/95 px-2 py-2 backdrop-blur lg:hidden">
            {mobileNav.map((item) => {
              const Icon = item.icon
              const active = isActive(location.pathname, item)
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={[
                    'flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium transition',
                    active ? 'text-emerald-300' : 'text-zinc-500 hover:text-zinc-200',
                  ].join(' ')}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>
      </div>
    </div>
  )
}
