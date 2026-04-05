'use client';

import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';

interface ServicePerformance {
  id: string;
  name: string;
  bookings: number[];
  revenue: number[];
  trend: 'up' | 'down' | 'neutral';
}

interface ServicePerformanceSparklinesProps {
  services: ServicePerformance[];
}

export function ServicePerformanceSparklines({ services }: ServicePerformanceSparklinesProps) {
  const getTrendColor = (trend: ServicePerformance['trend']) => {
    switch (trend) {
      case 'up': return 'text-emerald-400';
      case 'down': return 'text-red-400';
      default: return 'text-slate-400';
    }
  };

  const getTrendIcon = (trend: ServicePerformance['trend']) => {
    switch (trend) {
      case 'up': return '↑';
      case 'down': return '↓';
      default: return '→';
    }
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
      <h3 className="text-lg font-semibold text-white mb-4">Service Performance</h3>
      <div className="space-y-4">
        {services.map((service) => (
          <div key={service.id} className="flex items-center justify-between rounded-lg bg-slate-800/50 p-3">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-white">{service.name}</span>
                <span className={"text-xs font-medium " + getTrendColor(service.trend)}>
                  {getTrendIcon(service.trend)} {service.trend === 'up' ? '+' : service.trend === 'down' ? '-' : ''}{Math.abs(service.bookings[service.bookings.length - 1] - service.bookings[0])}
                </span>
              </div>
              <div className="h-8">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={service.bookings.map((value, index) => ({ value, index }))}>
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke={service.trend === 'up' ? '#34d399' : service.trend === 'down' ? '#f87171' : '#94a3b8'} 
                      strokeWidth={2}
                      dot={false}
                    />
                    <Tooltip 
                      content={({ payload }) => {
                        if (payload && payload[0]) {
                          return (
                            <div className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white">
                              {payload[0].value} bookings
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
export default ServicePerformanceSparklines;
