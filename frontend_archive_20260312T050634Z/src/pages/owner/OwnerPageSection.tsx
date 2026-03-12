import { ReactNode } from 'react'
import { glass, semantic, component } from '../../lib/design-tokens';

type OwnerPageSectionProps = {
  eyebrow?: string
  title: string
  description?: string
  children: ReactNode
}

export default function OwnerPageSection({ eyebrow, title, description, children }: OwnerPageSectionProps) {
  return (
    <section className="rounded-[28px] border semantic.border.default bg-[linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.03))] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.24)] backdrop-blur-lg sm:p-6">
      <div className="mb-5">
        {eyebrow ? <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-300/80">{eyebrow}</p> : null}
        <h3 className="text-lg font-semibold tracking-tight text-white sm:text-xl">{title}</h3>
        {description ? <p className="mt-1.5 max-w-3xl text-sm leading-6 text-zinc-400">{description}</p> : null}
      </div>
      {children}
    </section>
  )
}
