import type { ReactNode } from 'react'
import { ArrowUpRight, Sparkles } from 'lucide-react'
import { glass } from '../../lib/design-tokens'

type SurfaceProps = {
  title?: string
  description?: string
  eyebrow?: string
  aside?: ReactNode
  children?: ReactNode
}

type StatItem = {
  label: string
  value: string
  hint?: string
  tone?: string
}

type ChipItem = {
  label: string
  value: string
}

export function RoleSurface({ title, description, children }: SurfaceProps) {
  return (
    <section className={`${glass.default} rounded-[28px] p-5 sm:p-6 lg:p-7`}>
      {(title || description) && (
        <div className="mb-5">
          {title ? <h2 className="text-xl font-semibold tracking-tight text-white">{title}</h2> : null}
          {description ? <p className="mt-2 text-sm leading-6 text-zinc-300">{description}</p> : null}
        </div>
      )}
      {children}
    </section>
  )
}

export function RoleHero({ eyebrow, title, description, aside, children }: SurfaceProps) {
  return (
    <section className={`${glass.strong} relative overflow-hidden rounded-[28px] p-5 sm:p-6 lg:p-7`}>
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),transparent_28%,transparent_72%,rgba(255,255,255,0.03))]" />
      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          {eyebrow ? (
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-zinc-900/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-200">
              <Sparkles className="h-3.5 w-3.5" />
              <span>{eyebrow}</span>
            </div>
          ) : null}
          {title ? <h3 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">{title}</h3> : null}
          {description ? <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-300">{description}</p> : null}
          {children ? <div className="mt-5">{children}</div> : null}
        </div>
        {aside ? <div className="relative shrink-0">{aside}</div> : null}
      </div>
    </section>
  )
}

export function RoleStatGrid({ items }: { items: StatItem[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className={`${glass.default} rounded-[28px] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]`}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">{item.label}</p>
          <div className="mt-3 flex items-end justify-between gap-3">
            <span className={`text-2xl font-bold ${item.tone ?? 'text-white'}`}>{item.value}</span>
            <ArrowUpRight className="h-4 w-4 text-zinc-500" />
          </div>
          {item.hint ? <p className="mt-2 text-xs text-zinc-400">{item.hint}</p> : null}
        </div>
      ))}
    </div>
  )
}

export function RoleSection({ title, description, children }: SurfaceProps) {
  return (
    <section className={`${glass.default} rounded-[28px] p-4 sm:p-5 lg:p-6`}>
      {(title || description) && (
        <div className="mb-4">
          {title ? <h3 className="text-base font-semibold text-white sm:text-lg">{title}</h3> : null}
          {description ? <p className="mt-1 text-sm text-zinc-400">{description}</p> : null}
        </div>
      )}
      {children}
    </section>
  )
}

export function RoleChipRow({ items }: { items: ChipItem[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <div key={item.label} className={`${glass.subtle} rounded-full px-3 py-2 text-xs text-zinc-300`}>
          <span className="text-zinc-500">{item.label}</span>
          <span className="mx-2 text-zinc-600">•</span>
          <span className="font-medium text-white">{item.value}</span>
        </div>
      ))}
    </div>
  )
}

export const KpiGrid = RoleStatGrid
export const TagList = RoleChipRow
