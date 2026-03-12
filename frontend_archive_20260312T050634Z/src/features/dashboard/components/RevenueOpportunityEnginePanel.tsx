import { DollarSign, Sparkles, Users, CalendarClock } from 'lucide-react';
import { useRevenueOpportunities } from '../../../core/hooks/useRevenueOpportunities';

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
      <div className="mb-3 flex items-center justify-between text-zinc-400">
        <span className="text-sm">{label}</span>
        <span>{icon}</span>
      </div>
      <div className="text-2xl font-semibold text-white">{value}</div>
    </div>
  );
}

export default function RevenueOpportunityEnginePanel() {
  const { data, loading, error } = useRevenueOpportunities();

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">AI Revenue Opportunity Engine</h3>
          <p className="text-sm text-zinc-400">Live demand recovery signals for the next {data?.window_days ?? 7} days</p>
        </div>
        <Sparkles className="h-5 w-5 text-amber-400" />
      </div>

      {loading ? (
        <div className="text-sm text-zinc-400">Loading live revenue intelligence...</div>
      ) : error ? (
        <div className="text-sm text-red-400">{error}</div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Empty Slots" value={data?.empty_slots ?? 0} icon={<CalendarClock className="h-4 w-4" />} />
            <StatCard label="Rebookable Clients" value={data?.rebookable_clients ?? 0} icon={<Users className="h-4 w-4" />} />
            <StatCard label="Suggested Promotions" value={data?.suggested_promotions ?? 0} icon={<Sparkles className="h-4 w-4" />} />
            <StatCard label="Recoverable Revenue" value={`$${Number(data?.estimated_recoverable_revenue ?? 0).toFixed(2)}`} icon={<DollarSign className="h-4 w-4" />} />
          </div>

          <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950/50 p-4 text-sm text-zinc-400">
            Average ticket basis: <span className="font-medium text-white">${Number(data?.avg_ticket ?? 0).toFixed(2)}</span>
            <span className="mx-2 text-zinc-600">•</span>
            Generated: <span className="font-medium text-white">{data?.generated_at ? new Date(data.generated_at).toLocaleString() : '--'}</span>
          </div>
        </>
      )}
    </div>
  );
}
