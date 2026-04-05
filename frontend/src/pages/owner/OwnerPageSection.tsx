import { ReactNode } from 'react'

type OwnerPageSectionProps = {
  eyebrow?: string
  title: string
  description?: string
  children: ReactNode
}

export default function OwnerPageSection({ eyebrow, title, description, children }: OwnerPageSectionProps) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 shadow-2xl shadow-black/10 sm:p-6">
      <div className="mb-5">
        {eyebrow ? <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-300/80">{eyebrow}</p> : null}
        <h3 className="text-lg font-semibold text-white sm:text-xl">{title}</h3>
        {description ? <p className="mt-1 text-sm text-zinc-400">{description}</p> : null}
      </div>
      {children}
    </section>
  )
}
