'use client'

import { TrendingUp, Star, Calendar } from 'lucide-react'

interface StaffPerformanceCardProps {
  staff: {
    id: string
    name: string
    role?: string
    rating?: number
    appointmentsThisMonth?: number
    revenue?: number
  }
}

export default function StaffPerformanceCard({ staff }: StaffPerformanceCardProps) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="h-10 w-10 rounded-full bg-slate-700 flex items-center justify-center">
          <span className="text-sm font-medium text-white">{staff.name?.charAt(0) || '?'}</span>
        </div>
        <div>
          <p className="text-sm font-medium text-white">{staff.name}</p>
          <p className="text-xs text-slate-500">{staff.role || 'Staff'}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-slate-400">
            <Star className="h-3 w-3 text-gold-400" />
            <span className="text-xs">Rating</span>
          </div>
          <p className="text-sm font-medium text-white">{staff.rating?.toFixed(1) || 'N/A'}</p>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-slate-400">
            <Calendar className="h-3 w-3" />
            <span className="text-xs">Appts</span>
          </div>
          <p className="text-sm font-medium text-white">{staff.appointmentsThisMonth || 0}</p>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-slate-400">
            <TrendingUp className="h-3 w-3 text-emerald-400" />
            <span className="text-xs">Rev</span>
          </div>
          <p className="text-sm font-medium text-white">${(staff.revenue || 0).toLocaleString()}</p>
        </div>
      </div>
    </div>
  )
}
