import type { ReactNode } from 'react'
import ErrorBoundary from '../system/ErrorBoundary'
import { glass, semantic, component } from '../../lib/design-tokens';

type OwnerModuleBoundaryProps = {
  title: string
  children: ReactNode
  density?: 'default' | 'compact'
}

export default function OwnerModuleBoundary({ title, children, density = 'default' }: OwnerModuleBoundaryProps) {
  const shellClass = density === 'compact'
    ? 'rounded-[22px] border semantic.border.default bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.024))] p-3 shadow-[0_14px_40px_rgba(0,0,0,0.18)] backdrop-blur-lg sm:p-4'
    : 'rounded-[24px] border semantic.border.default bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.028))] p-4 shadow-[0_16px_48px_rgba(0,0,0,0.2)] backdrop-blur-lg sm:p-5'

  return (
    <ErrorBoundary
      fallback={
        <section className="rounded-[24px] border border-amber-400/20 bg-[linear-gradient(180deg,rgba(245,158,11,0.14),rgba(245,158,11,0.08))] p-5 text-amber-50 shadow-[0_18px_50px_rgba(0,0,0,0.2)] backdrop-blur-sm sm:p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-200/80">Owner module degraded</p>
          <h3 className="mt-2 text-base font-semibold tracking-tight text-white">{title}</h3>
          <p className="mt-2 max-w-xl text-sm leading-6 text-amber-50/80">
            This module is temporarily unavailable, but the rest of the owner workspace remains operational.
          </p>
        </section>
      }
    >
      <section className={shellClass}>
        <div className="mb-3 flex items-start justify-between gap-3 border-b semantic.border.subtle pb-2.5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">Owner module</p>
            <h3 className="mt-1 text-sm font-semibold tracking-tight text-white sm:text-base">{title}</h3>
          </div>
        </div>
        {children}
      </section>
    </ErrorBoundary>
  )
}
