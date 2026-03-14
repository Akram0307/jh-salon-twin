'use client'

import { Lightbulb, TrendingUp, AlertCircle } from 'lucide-react'

const insights = [
  {
    type: 'opportunity',
    title: 'Revenue Opportunity',
    description: '3 open slots tomorrow could generate ~$420 if filled.'
  },
  {
    type: 'trend',
    title: 'Client Trend',
    description: 'Returning clients increased 12% this week.'
  },
  {
    type: 'alert',
    title: 'Retention Alert',
    description: '5 VIP clients have not visited in 45+ days.'
  }
]

export default function AIInsightsPanel() {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="h-5 w-5 text-yellow-400" />
        <h3 className="text-white font-semibold">AI Insights</h3>
      </div>

      <div className="space-y-3">
        {insights.map((i, idx) => (
          <div key={idx} className="rounded-lg bg-slate-800/50 p-3">
            <div className="flex items-center gap-2 mb-1">
              {i.type === 'opportunity' && <TrendingUp className="h-4 w-4 text-emerald-400" />}
              {i.type === 'alert' && <AlertCircle className="h-4 w-4 text-amber-400" />}
              {i.type === 'trend' && <TrendingUp className="h-4 w-4 text-blue-400" />}
              <p className="text-sm font-medium text-white">{i.title}</p>
            </div>
            <p className="text-xs text-slate-400">{i.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
