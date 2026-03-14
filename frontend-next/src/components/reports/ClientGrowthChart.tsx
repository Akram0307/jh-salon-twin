'use client'

import { useState } from 'react'
import { Users, UserPlus, UserCheck, TrendingUp } from 'lucide-react'

interface ClientGrowthChartProps {
  data?: Array<{ date: string; newClients: number; returningClients: number }>
  period?: 'week' | 'month' | 'quarter'
  hideControls?: boolean
}

export default function ClientGrowthChart({ data = [], period = 'month', hideControls = false }: ClientGrowthChartProps) {
  const [selectedPeriod, setSelectedPeriod] = useState(period)

  // Generate mock data if none provided
  const chartData = data.length > 0 ? data : generateMockData(selectedPeriod)
  
  const totalNew = chartData.reduce((sum, d) => sum + d.newClients, 0)
  const totalReturning = chartData.reduce((sum, d) => sum + d.returningClients, 0)
  const totalClients = totalNew + totalReturning
  const retentionRate = totalClients > 0 ? (totalReturning / totalClients) * 100 : 0
  const maxValue = Math.max(...chartData.map(d => d.newClients + d.returningClients))

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 sm:p-5">
      {!hideControls && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/10 p-2">
              <Users className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Client Growth</h3>
              <p className="text-xs text-slate-500">Total: {totalClients} clients</p>
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
            <div className="flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-blue-400" />
              <p className="text-xs text-slate-500">New Clients</p>
            </div>
            <p className="text-lg font-semibold text-blue-400 font-mono">{totalNew}</p>
          </div>
          <div className="rounded-lg bg-slate-800/50 p-3">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-emerald-400" />
              <p className="text-xs text-slate-500">Returning</p>
            </div>
            <p className="text-lg font-semibold text-emerald-400 font-mono">{totalReturning}</p>
          </div>
          <div className="rounded-lg bg-slate-800/50 p-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-gold-400" />
              <p className="text-xs text-slate-500">Retention</p>
            </div>
            <p className="text-lg font-semibold text-gold-400 font-mono">{retentionRate.toFixed(1)}%</p>
          </div>
        </div>
      )}

      {/* Stacked Bar Chart */}
      <div className="h-[240px] sm:h-[280px] lg:h-[320px] flex items-end gap-1">
        {chartData.map((item, i) => {
          const totalHeight = ((item.newClients + item.returningClients) / maxValue) * 100
          const newHeight = (item.newClients / (item.newClients + item.returningClients)) * totalHeight
          const returnHeight = totalHeight - newHeight
          
          return (
            <div
              key={i}
              className="flex-1 flex flex-col items-center"
            >
              <div className="w-full flex flex-col" style={{ height: `${totalHeight}%` }}>
                <div
                  className="w-full bg-emerald-500/70 hover:bg-emerald-500/90 transition-all cursor-pointer rounded-t-sm"
                  style={{ height: `${returnHeight}%` }}
                  title={`Returning: ${item.returningClients}`}
                />
                <div
                  className="w-full bg-blue-500/70 hover:bg-blue-500/90 transition-all cursor-pointer"
                  style={{ height: `${newHeight}%` }}
                  title={`New: ${item.newClients}`}
                />
              </div>
              {i % Math.ceil(chartData.length / 7) === 0 && (
                <span className="text-[10px] text-slate-500 mt-1">{item.date}</span>
              )}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-blue-500/70" />
          <span className="text-xs text-slate-400">New Clients</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-emerald-500/70" />
          <span className="text-xs text-slate-400">Returning</span>
        </div>
      </div>
    </div>
  )
}

function generateMockData(period: string) {
  const days = period === 'week' ? 7 : period === 'month' ? 30 : 90
  const data = []
  
  for (let i = 0; i < days; i++) {
    const date = new Date()
    date.setDate(date.getDate() - (days - i - 1))
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      newClients: Math.floor(2 + Math.random() * 5),
      returningClients: Math.floor(5 + Math.random() * 10)
    })
  }
  return data
}
