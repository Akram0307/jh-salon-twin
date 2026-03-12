import { useEffect, useState } from "react";

interface Gap {
  staff_name: string
  hour: number
  bookings: number
  potential_revenue: number
}

export default function RevenueOpportunityPanel() {
  const [gaps, setGaps] = useState<Gap[]>([])

  useEffect(() => {
    fetch('/api/analytics/utilization-heatmap')
      .then(r => r.json())
      .then(data => {
        if (!Array.isArray(data)) return

        const opportunities: Gap[] = []

        data.forEach((row:any) => {
          if (row.bookings <= 1) {
            opportunities.push({
              staff_name: row.staff_name,
              hour: row.hour,
              bookings: row.bookings,
              potential_revenue: (3 - row.bookings) * (row.avg_price || 500)
            })
          }
        })

        setGaps(opportunities.slice(0,5))
      })
  }, [])

  return (
    <div className="bg-white rounded-xl shadow p-4">
      <h3 className="text-lg font-semibold mb-3">Revenue Opportunities</h3>

      {gaps.length === 0 && (
        <p className="text-gray-500 text-sm">No gaps detected</p>
      )}

      <div className="space-y-2">
        {gaps.map((g, i) => (
          <div key={i} className="flex justify-between text-sm border-b pb-2">
            <div>
              <div className="font-medium">{g.staff_name}</div>
              <div className="text-gray-500">{g.hour}:00 slot underutilized</div>
            </div>
            <div className="text-green-600 font-semibold">
              ₹{g.potential_revenue}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
