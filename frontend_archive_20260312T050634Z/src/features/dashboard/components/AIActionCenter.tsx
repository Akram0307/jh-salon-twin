import type { ReactNode } from 'react';
import { glass, semantic, component } from '../../../lib/design-tokens';

function Badge({ children, variant }: { children: ReactNode; variant: 'critical' | 'high' | 'medium' }) {
  const styles = {
    critical: 'bg-red-500/20 text-red-200 border-red-500/30',
    high: 'bg-amber-500/20 text-amber-200 border-amber-500/30',
    medium: 'bg-sky-500/20 text-sky-200 border-sky-500/30',
  };

  return (
    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${styles[variant]}`}>
      {children}
    </span>
  );
}

function ActionButtons() {
  return (
    <div className="mt-3 flex gap-2">
      <button className="rounded-lg border semantic.border.default glass.default px-3 py-1 text-xs text-white backdrop-blur-md hover:bg-white/20">
        Review
      </button>
      <button className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200 backdrop-blur-md hover:bg-emerald-500/20">
        Approve
      </button>
    </div>
  );
}

function SummaryCard({ label, value, accent }: { label: string; value: string | number; accent: string }) {
  return (
    <div className="rounded-[22px] border semantic.border.default bg-white/[0.045] px-4 py-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">{label}</div>
      <div className={`mt-2 text-xl font-semibold ${accent}`}>{value}</div>
      <ActionButtons />
    </div>
  );
}

export default function AIActionCenter() {
  return (
    <section className="relative rounded-[30px] border semantic.border.default bg-zinc-900/90 p-6 glass.default">
      <h3 className="text-xl font-semibold text-white">AI Action Center</h3>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Rebookable" value="12" accent="text-emerald-300" />
        <SummaryCard label="Low Capacity" value="3" accent="text-amber-300" />
        <SummaryCard label="Active" value="5" accent="text-sky-300" />
        <SummaryCard label="Paused" value="2" accent="text-fuchsia-300" />
      </div>

      <div className="mt-6 rounded-[28px] border semantic.border.default bg-zinc-900/70 p-5">
        <h4 className="mb-4 text-sm font-medium text-white">Predictive Intervention</h4>
        <div className="space-y-3">
          {[
            { title: 'High churn risk: Client #882', urgency: 'critical' as const },
            { title: 'Capacity optimization: Tuesday', urgency: 'high' as const },
            { title: 'Staff schedule conflict', urgency: 'medium' as const },
          ].map((item) => (
            <div
              key={item.title}
              className="flex items-center justify-between rounded-xl border border-white/5 glass.subtle p-3"
            >
              <span className="text-sm text-zinc-300">{item.title}</span>
              <Badge variant={item.urgency}>{item.urgency.toUpperCase()}</Badge>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
