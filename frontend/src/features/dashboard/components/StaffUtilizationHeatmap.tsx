import { useEffect, useMemo, useState } from "react";
import { getUtilizationHeatmap, UtilizationHeatmapResponse } from '../../../services/api';
import { asArray } from '../../../core/api/utils';

interface HeatCell {
  staff_name?: string;
  full_name?: string;
  hour: number;
  bookings?: number;
  appointments?: number;
}

export default function StaffUtilizationHeatmap() {
  const [data, setData] = useState<HeatCell[]>([]);

  useEffect(() => {
    getUtilizationHeatmap()
      .then((res) => setData((((res as UtilizationHeatmapResponse).heatmap || []).flat()) as unknown as HeatCell[]))
      .catch(() => setData([]));
  }, []);

  const safeData = useMemo(() => asArray<HeatCell>(data), [data]);
  const intensity = (n: number) => n >= 6 ? 'bg-green-500' : n >= 4 ? 'bg-green-400' : n >= 2 ? 'bg-yellow-400' : n >= 1 ? 'bg-zinc-600' : 'bg-zinc-800';

  const grouped = useMemo(() => safeData.reduce((acc: Record<string, HeatCell[]>, row) => {
    const key = row.staff_name || row.full_name || 'Staff';
    (acc[key] ||= []).push(row);
    return acc;
  }, {}), [safeData]);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <h3 className="text-lg font-semibold mb-4">Staff Utilization Heatmap</h3>
      {Object.keys(grouped).length === 0 && <p className="text-zinc-500 text-sm">No utilization data yet</p>}
      <div className="space-y-4">
        {Object.entries(grouped).map(([staff, rows]) => (
          <div key={staff}>
            <div className="text-sm text-zinc-300 mb-2">{staff}</div>
            <div className="grid grid-cols-12 gap-1">
              {asArray<HeatCell>(rows).sort((a, b) => a.hour - b.hour).map((r) => (
                <div key={r.hour} title={`${r.hour}:00 • ${r.bookings ?? r.appointments ?? 0} bookings`} className={`h-6 rounded ${intensity(Number(r.bookings ?? r.appointments ?? 0))}`} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
