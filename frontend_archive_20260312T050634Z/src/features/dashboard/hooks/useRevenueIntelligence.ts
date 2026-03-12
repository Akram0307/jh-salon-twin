import { useEffect, useState } from "react";
import { apiFetch } from "../../../core/api/client";

export interface RevenueIntelligence {
  generated_at: string;
  pos: {
    transactions_count: number;
    gross_sales: number;
    avg_ticket: number;
  };
  revenue_trend: { day: string; revenue: number }[];
  opportunities: {
    empty_slots_next_7_days: number;
    rebookable_clients: number;
  };
}

export function useRevenueIntelligence() {
  const [data, setData] = useState<RevenueIntelligence | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const res = await apiFetch<RevenueIntelligence>("/api/revenue/intelligence");
        if (active) setData(res);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to load revenue intelligence";
        if (active) setError(message);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    const interval = setInterval(load, 60000); // refresh every minute

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  return { data, loading, error };
}
