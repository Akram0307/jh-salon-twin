'use client'

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const data = [
  { day: 'Mon', revenue: 900 },
  { day: 'Tue', revenue: 1200 },
  { day: 'Wed', revenue: 1100 },
  { day: 'Thu', revenue: 1500 },
  { day: 'Fri', revenue: 1800 },
  { day: 'Sat', revenue: 2200 },
  { day: 'Sun', revenue: 1400 }
]

export default function RevenueChart() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis dataKey="day" stroke="#94a3b8" />
        <YAxis stroke="#94a3b8" />
        <Tooltip />
        <Area type="monotone" dataKey="revenue" stroke="#fbbf24" fill="#fbbf2422" />
      </AreaChart>
    </ResponsiveContainer>
  )
}
