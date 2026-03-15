import { useEffect, useState } from "react";
import { apiGet } from "../../../core/api/client";

export function useOwnerDashboard() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await apiGet("/api/analytics/overview");
        setData(res);
      } catch (e) {
        console.warn("Owner dashboard API unavailable, using fallback");
        setData({
          revenue_today: "--",
          bookings_today: "--",
          new_clients: "--"
        });
      }
    }

    load();
  }, []);

  return { data };
}
