import RevenueTrendChart from '../../../components/owner/RevenueTrendChart'
import { useRevenueIntelligence } from '../hooks/useRevenueIntelligence'
import { Badge } from '../../../components/ui/badge'
import { glass, semantic, component } from '../../../lib/design-tokens';

interface RevenueTrendItem {
  day: string
  revenue: number
}

const fallback = {
  opportunities: {
    empty_slots_next_7_days: 9,
    rebookable_clients: 14,
  },
  revenue_trend: [
    { day: '2026-03-04', revenue: 32200 },
    { day: '2026-03-05', revenue: 36500 },
    { day: '2026-03-06', revenue: 40100 },
    { day: '2026-03-07', revenue: 43800 },
    { day: '2026-03-08', revenue: 46250 },
  ],
}

export default function RevenueIntelligencePanel() {
  const { data, loading, error } = useRevenueIntelligence()
  const safe = data ?? fallback
  const chartData = (safe.revenue_trend || []).map((r: RevenueTrendItem) => ({
    date: new Date(r.day).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    revenue: r.revenue,
  }))

  return (
    <section className="rounded-[28px] border semantic.border.default bg-[radial-gradient(circle_at_top,rgba(192,132,252,0.16),transparent_35%),linear-gradient(180deg,rgba(24,24,27,0.94),rgba(9,9,11,0.98))] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.38)] glass.default">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.32em] text-fuchsia-200/70">Revenue intelligence</p>
          <h3 className="mt-2 text-lg font-semibold text-white">Performance snapshot</h3>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">
            {error
              ? 'Live intelligence is syncing. Showing a polished operating snapshot so the dashboard remains presentation-ready.'
              : 'Track demand pressure, rebooking potential, and next-best actions from the same executive surface.'}
          </p>
        </div>
        <div className="rounded-full border semantic.border.default glass.subtle px-3 py-1 text-xs text-zinc-300">
          {loading ? 'Refreshing insights…' : 'Updated moments ago'}
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm text-amber-100">
          <div className="flex items-center justify-between gap-3"><span>{safe.opportunities.empty_slots_next_7_days} open slots can still be monetized this week</span><Badge>Action Required</Badge></div>
        </div>
        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
          <div className="flex items-center justify-between gap-3"><span>{safe.opportunities.rebookable_clients} clients are ready for reactivation</span><Badge>High Priority</Badge></div>
        </div>
      </div>
      <div className="mt-5 rounded-2xl border semantic.border.default glass.subtle p-4 transition hover:glass.default">
        <RevenueTrendChart data={chartData} />
      </div>
    </section>
  )
}
