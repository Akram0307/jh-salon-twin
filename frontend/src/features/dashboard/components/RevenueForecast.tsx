import { useEffect, useMemo, useState } from "react";
import { getRevenueForecast } from '../../../services/api';
import { asArray } from '../../../core/api/utils';

interface ForecastItem {
  date?: string;
  forecast_date?: string;
  revenue?: number;
  predicted_demand?: number;
}


export default function RevenueForecast() {
  const [forecast, setForecast] = useState<ForecastItem[]>([]);

  useEffect(() => {
    getRevenueForecast()
      .then((data) => setForecast((data.forecast || []) as unknown as ForecastItem[]))
      .catch(() => setForecast([]));
  }, []);

  const safeForecast = useMemo(() => asArray<ForecastItem>(forecast), [forecast]);

  return (
    <div className="bg-zinc-900 rounded-xl p-5 border border-zinc-800">
      <h3 className="text-lg font-semibold mb-4">AI Revenue Forecast</h3>
      {safeForecast.length ? (
        <div className="space-y-2 text-sm">
          {safeForecast.map((f, i) => <div key={i} className="flex justify-between border-b border-zinc-800 pb-1"><span>{f?.date || f?.forecast_date || '--'}</span><span className="text-green-400">${f?.revenue || f?.predicted_demand || 0}</span></div>)}
        </div>
      ) : <p className="text-zinc-500 text-sm">Forecast data unavailable</p>}
    </div>
  );
}
