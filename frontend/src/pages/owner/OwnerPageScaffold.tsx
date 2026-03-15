import { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import OwnerLayout from '../../components/layout/OwnerLayout'

type OwnerPageScaffoldProps = {
  title: string
  subtitle: string
  children?: ReactNode
  nextSteps?: Array<{ label: string; to: string }>
}

export default function OwnerPageScaffold({ title, subtitle, children, nextSteps = [] }: OwnerPageScaffoldProps) {
  return (
    <OwnerLayout title={title} subtitle={subtitle}>
      <div className="space-y-6">
        {children}
        {nextSteps.length ? (
          <section className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-400">Phase 0 Route Scaffold</h3>
            <div className="mt-4 flex flex-wrap gap-3">
              {nextSteps.map((step) => (
                <Link
                  key={step.to}
                  to={step.to}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-200 transition hover:bg-white/10"
                >
                  {step.label}
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </OwnerLayout>
  )
}
