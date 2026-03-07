import { useEffect, useState } from 'react';
import { apiFetch } from '../api/client';

export type RevenueOpportunityMetrics = {
  empty_slots: number;
  rebookable_clients: number;
  suggested_promotions: number;
  estimated_recoverable_revenue: number;
  avg_ticket: number;
  window_days: number;
  generated_at: string;
};

export function useRevenueOpportunities() {
  const [data, setData] = useState<RevenueOpportunityMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const result = await apiFetch<RevenueOpportunityMetrics>('/api/analytics/revenue-opportunities');
        if (active) setData(result);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Failed to load revenue opportunities');
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  return { data, loading, error };
}
