import { ReactNode, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  BarChart3,
  BriefcaseBusiness,
  CalendarDays,
  ChevronRight,
  Home,
  Menu,
  Settings,
  Sparkles,
  UserCircle2,
  Users,
  X,
} from 'lucide-react'
import { glass, semantic, component } from '../../lib/design-tokens'

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
  group: 'overview' | 'operations' | 'business'
  description: string
}

const navItems: NavItem[] = [
  { label: 'Dashboard', to: '/owner/dashboard', icon: Home, aliases: ['/owner'], group: 'overview', description: 'Executive snapshot and priorities' },
  { label: 'Schedule', to: '/owner/schedule', icon: CalendarDays, group: 'operations', description: 'Appointments, gaps, and flow' },
  { label: 'Staff', to: '/owner/staff', icon: Users, group: 'operations', description: 'Team coverage and performance' },
  { label: 'Clients', to: '/owner/clients', icon: UserCircle2, group: 'operations', description: 'Relationships and retention health' },
  { label: 'Services', to: '/owner/services', icon: BriefcaseBusiness, group: 'business', description: 'Menu structure and pricing posture' },
  { label: 'Reports', to: '/owner/reports', icon: BarChart3, group: 'business', description: 'Revenue trends and performance' },
  { label: 'Settings', to: '/owner/settings', icon: Settings, group: 'business', description: 'Platform controls and salon config' },
]

const navGroups: Array<{ key: NavItem['group']; label: string; blurb: string }> = [
  { key: 'overview', label: 'Overview', blurb: "Today's command lane" },
  { key: 'operations', label: 'Operations', blurb: 'Execution across staff and bookings' },
  { key: 'business', label: 'Business', blurb: 'Revenue posture and controls' },
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

function OwnerNavLink({ item, pathname, onNavigate }: { item: NavItem; pathname: string; onNavigate?: () => void }) {
  const Icon = item.icon
  const active = isActive(pathname, item)

  return (
    <Link
      to={item.to}
      onClick={onNavigate}
      className={[
        'group flex items-start gap-3 rounded-[22px] border px-4 py-3.5 transition-all duration-200',
        active
          ? 'border-emerald-300/20 bg-[linear-gradient(180deg,rgba(16,185,129,0.18),rgba(16,185,129,0.08))] text-white shadow-[0_18px_40px_rgba(16,185,129,0.12)] ring-1 ring-emerald-300/10'
          : `${semantic.border.subtle} ${glass.subtle} text-zinc-300 hover:${semantic.border.hover} hover:${glass.default} hover:text-white`,
      ].join(' ')}
    >
      <div
        className={[
          'mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border transition-all duration-200',
          active
            ? 'border-emerald-300/18 bg-emerald-300/12 text-emerald-200'
            : `${semantic.border.default} ${glass.default} text-zinc-400 group-hover:text-zinc-200`,
        ].join(' ')}
      >
        <Icon className="h-4.5 w-4.5" />
      </div>
      <div className="min-w-0">
        <div className="text-sm font-semibold tracking-tight">{item.label}</div>
        <p className={['mt-1 text-xs leading-5', active ? 'text-zinc-100/80' : 'text-zinc-500 group-hover:text-zinc-400'].join(' ')}>{item.description}</p>
      </div>
    </Link>
  )
}

export default function OwnerLayout({ children, title, subtitle, actions }: OwnerLayoutProps) {
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const ownerSegments = useMemo(() => location.pathname.split('/').filter(Boolean).slice(1), [location.pathname])
  const activeItem = navItems.find((item) => isActive(location.pathname, item)) ?? navItems[0]

  return (
    <div className="owner-shell owner-grid-glow min-h-screen text-zinc-100">
      <div className="mx-auto flex min-h-screen w-full max-w-[1680px] gap-0 px-0 xl:px-4">
        <aside className="hidden w-[312px] shrink-0 p-4 lg:block xl:p-5">
          <div className="sticky top-4 flex h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-[34px] owner-panel-strong xl:top-5 xl:h-[calc(100vh-2.5rem)]">
            <div className={`border-b ${semantic.border.default} px-6 py-6`}>
              <div className="flex items-center gap-4">
                <div className={`flex h-14 w-14 items-center justify-center rounded-[22px] border ${semantic.border.default} bg-[linear-gradient(180deg,rgba(255,255,255,0.14),rgba(255,255,255,0.05))] shadow-[0_20px_40px_rgba(0,0,0,0.22)] ring-1 ring-emerald-300/10`}>
                  <Sparkles className="h-6 w-6 text-emerald-300" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-500">SalonOS</p>
                  <h1 className="mt-1 text-xl font-semibold tracking-tight text-white">Owner HQ</h1>
                  <p className="mt-1 text-sm text-zinc-400">A sharper command center for revenue, floor flow, and decision-making.</p>
                </div>
              </div>
            </div>

            <div className={`border-b ${semantic.border.default} px-6 py-5`}>
              <div className="rounded-[24px] owner-panel p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">Live workspace</p>
                <div className="mt-2 text-base font-semibold text-white">{activeItem.label}</div>
                <p className="mt-1 text-sm leading-6 text-zinc-400">{activeItem.description}</p>
              </div>
            </div>

            <nav className="flex-1 space-y-6 overflow-y-auto px-4 py-5">
              {navGroups.map((group) => {
                const items = navItems.filter((item) => item.group === group.key)
                return (
                  <section key={group.key} className="space-y-3">
                    <div className="px-2">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">{group.label}</p>
                      <p className="mt-1 text-xs leading-5 text-zinc-500">{group.blurb}</p>
                    </div>
                    <div className="space-y-2">
                      {items.map((item) => (
                        <OwnerNavLink key={item.to} item={item} pathname={location.pathname} />
                      ))}
                    </div>
                  </section>
                )
              })}
            </nav>
          </div>
        </aside>

        <div className="flex min-h-screen min-w-0 flex-1 flex-col px-0 pb-24 lg:px-4 lg:py-4 xl:px-5 xl:py-5">
          <header className={`sticky top-0 z-30 border-b ${semantic.border.default} bg-[rgba(9,9,11,0.82)] backdrop-blur-lg lg:top-4 lg:rounded-[30px] lg:border lg:bg-[rgba(9,9,11,0.72)] lg:shadow-[0_18px_60px_rgba(0,0,0,0.24)] xl:top-5`}>
            <div className="px-4 py-4 sm:px-6 lg:px-7 lg:py-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                      <Link to="/owner/dashboard" className="transition hover:text-zinc-300">Owner</Link>
                      {ownerSegments.map((segment, index) => {
                        const to = '/owner/' + ownerSegments.slice(0, index + 1).join('/')
                        const isLast = index === ownerSegments.length - 1
                        return (
                          <span key={to} className="flex items-center gap-2">
                            <ChevronRight className="h-3.5 w-3.5" />
                            {isLast ? <span className="text-zinc-300">{prettifySegment(segment)}</span> : <Link to={to} className="transition hover:text-zinc-300">{prettifySegment(segment)}</Link>}
                          </span>
                        )
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={() => setMobileMenuOpen((value) => !value)}
                      className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl border ${semantic.border.default} bg-white/[0.06] text-zinc-200 shadow-[0_10px_24px_rgba(0,0,0,0.2)] lg:hidden`}
                      aria-label="Toggle owner navigation"
                    >
                      {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </button>
                  </div>

                  <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                    <div className="min-w-0">
                      <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-200">
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>Owner operating shell</span>
                      </div>
                      <h2 className="mt-4 text-2xl font-semibold tracking-tight text-white sm:text-[2rem]">{title ?? 'Owner Portal'}</h2>
                      {subtitle ? <p className="mt-2 max-w-3xl text-sm leading-7 text-zinc-400 sm:text-[15px]">{subtitle}</p> : null}
                    </div>

                    <div className="grid gap-2 text-xs text-zinc-300 sm:grid-cols-3">
                      <div className={`rounded-2xl border ${semantic.border.default} ${glass.default} px-3 py-2.5`}>Grouped operational navigation</div>
                      <div className={`rounded-2xl border ${semantic.border.default} ${glass.default} px-3 py-2.5`}>Shared page architecture</div>
                      <div className={`rounded-2xl border ${semantic.border.default} ${glass.default} px-3 py-2.5`}>Reduced dashboard density</div>
                    </div>
                  </div>
                </div>

                {actions ? <div className="shrink-0">{actions}</div> : null}
              </div>

              {mobileMenuOpen ? (
                <div className={`mt-5 space-y-4 rounded-[28px] border ${semantic.border.default} bg-[linear-gradient(180deg,rgba(10,14,26,0.98),rgba(9,9,11,0.96))] p-3.5 shadow-[0_24px_80px_rgba(0,0,0,0.35)] lg:hidden`}>
                  {navGroups.map((group) => {
                    const items = navItems.filter((item) => item.group === group.key)
                    return (
                      <section key={group.key} className="space-y-2">
                        <div className="px-2 pt-1">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">{group.label}</p>
                          <p className="mt-1 text-xs leading-5 text-zinc-500">{group.blurb}</p>
                        </div>
                        <div className="space-y-2">
                          {items.map((item) => (
                            <OwnerNavLink key={item.to} item={item} pathname={location.pathname} onNavigate={() => setMobileMenuOpen(false)} />
                          ))}
                        </div>
                      </section>
                    )
                  })}
                </div>
              ) : null}
            </div>
          </header>

          <main className="min-w-0 flex-1 px-4 pt-6 sm:px-6 lg:px-0 lg:pt-8">
            <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-8 lg:gap-10">{children}</div>
          </main>
        </div>
      </div>
    </div>
  )
}
