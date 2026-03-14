'use client'

import { useState } from 'react'
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react'

interface RevenueChartProps {
  data?: Array<{ date: string; revenue: number }>
  period?: 'week' | 'month' | 'quarter'
  hideControls?: boolean
}

export default function RevenueChart({ data = [], period = 'week', hideControls = false }: RevenueChartProps) {
  const [selectedPeriod, setSelectedPeriod] = useState(period)

  // Generate mock data if none provided
  const chartData = data.length > 0 ? data : generateMockData(selectedPeriod)
  
  const totalRevenue = chartData.reduce((sum, d) => sum + d.revenue, 0)
  const avgRevenue = totalRevenue / chartData.length
  const maxRevenue = Math.max(...chartData.map(d => d.revenue))
  const minRevenue = Math.min(...chartData.map(d => d.revenue))
  
  // Calculate trend (comparing last value to average)
  const lastValue = chartData[chartData.length - 1]?.revenue || 0
  const trend = ((lastValue - avgRevenue) / avgRevenue) * 100

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 sm:p-5">
      {!hideControls && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-500/10 p-2">
              <DollarSign className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Revenue Overview</h3>
              <p className="text-xs text-slate-500">Total: ${totalRevenue.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {['week', 'month', 'quarter'].map((p) => (
              <button
                key={p}
                onClick={() => setSelectedPeriod(p as any)}
                className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                  selectedPeriod === p
                    ? 'bg-gold-500 text-slate-950'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>
      )}

      {!hideControls && (
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="rounded-lg bg-slate-800/50 p-3">
            <p className="text-xs text-slate-500">Average</p>
            <p className="text-lg font-semibold text-white font-mono">${avgRevenue.toFixed(0)}</p>
          </div>
          <div className="rounded-lg bg-slate-800/50 p-3">
            <p className="text-xs text-slate-500">Peak</p>
            <p className="text-lg font-semibold text-emerald-400 font-mono">${maxRevenue.toLocaleString()}</p>
          </div>
          <div className="rounded-lg bg-slate-800/50 p-3">
            <p className="text-xs text-slate-500">Trend</p>
            <div className="flex items-center gap-1">
              {trend >= 0 ? (
                <TrendingUp className="h-4 w-4 text-emerald-400" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-400" />
              )}
              <p className={`text-lg font-semibold font-mono ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {trend >= 0 ? '+' : ''}{trend.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="h-[240px] sm:h-[280px] lg:h-[320px] flex items-end gap-1">
        {chartData.map((item, i) => {
          const height = (item.revenue / maxRevenue) * 100
          return (
            <div
              key={i}
              className="flex-1 flex flex-col items-center gap-1"
            >
              <div
                className="w-full bg-gradient-to-t from-emerald-500/50 to-emerald-500 rounded-t-sm hover:from-emerald-500/70 hover:to-emerald-500/90 transition-all cursor-pointer"
                style={{ height: `${height}%` }}
                title={`${item.date}: $${item.revenue.toLocaleString()}`}
              />
              {i % Math.ceil(chartData.length / 7) === 0 && (
                <span className="text-[10px] text-slate-500 rotate-45 origin-left">{item.date}</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function generateMockData(period: string) {
  const days = period === 'week' ? 7 : period === 'month' ? 30 : 90
  const data = []
  const baseRevenue = 1500
  
  for (let i = 0; i < days; i++) {
    const date = new Date()
    date.setDate(date.getDate() - (days - i - 1))
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      revenue: Math.floor(baseRevenue + Math.random() * 1000 - 200 + (i * 20))
    })
  }
  return data
}
