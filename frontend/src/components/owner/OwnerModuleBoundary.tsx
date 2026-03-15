import { ReactNode } from 'react'
import ErrorBoundary from '../system/ErrorBoundary'

type OwnerModuleBoundaryProps = {
  title: string
  children: ReactNode
}

export default function OwnerModuleBoundary({ title, children }: OwnerModuleBoundaryProps) {
  return (
    <ErrorBoundary
      fallback={
        <section className="rounded-3xl border border-amber-400/20 bg-amber-500/10 p-5 text-amber-50">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-200/80">Owner module degraded</p>
          <h3 className="mt-2 text-base font-semibold text-white">{title}</h3>
          <p className="mt-2 text-sm text-amber-50/80">
            This module is temporarily unavailable, but the rest of the owner workspace remains operational.
          </p>
        </section>
      }
    >
      {children}
    </ErrorBoundary>
  )
}
