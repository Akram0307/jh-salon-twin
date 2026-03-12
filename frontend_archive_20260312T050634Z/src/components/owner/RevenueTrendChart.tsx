import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

interface RevenuePoint {
  date: string
  revenue: number
}

interface Props {
  data: RevenuePoint[]
}

export default function RevenueTrendChart({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="p-4 text-sm text-gray-400">
        No revenue data available
      </div>
    )
  }

  return (
    <div className="w-full h-64 bg-zinc-900 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-white mb-2">Revenue Trend</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis dataKey="date" stroke="#a1a1aa" />
          <YAxis stroke="#a1a1aa" />
          <Tooltip
            contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a' }}
            labelStyle={{ color: '#e4e4e7' }}
          />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#22c55e"
            strokeWidth={3}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
