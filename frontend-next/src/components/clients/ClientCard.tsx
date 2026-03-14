'use client'

import { User, Calendar, DollarSign } from 'lucide-react'

interface ClientCardProps {
  client: {
    id: string
    name: string
    email?: string
    phone?: string
    totalVisits?: number
    totalSpent?: number
    lastVisit?: string
  }
}

export default function ClientCard({ client }: ClientCardProps) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 hover:border-slate-700 transition-colors">
      <div className="flex items-start gap-3">
        <div className="h-12 w-12 rounded-full bg-slate-700 flex items-center justify-center">
          <User className="h-6 w-6 text-slate-400" />
        </div>
        
        <div className="flex-1">
          <h3 className="font-medium text-white">{client.name}</h3>
          <p className="text-sm text-slate-500">{client.email || client.phone}</p>
        </div>
      </div>
      
      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-slate-400">
            <Calendar className="h-3 w-3" />
            <span className="text-xs">Visits</span>
          </div>
          <p className="text-sm font-medium text-white">{client.totalVisits || 0}</p>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-slate-400">
            <DollarSign className="h-3 w-3" />
            <span className="text-xs">Spent</span>
          </div>
          <p className="text-sm font-medium text-white">${(client.totalSpent || 0).toLocaleString()}</p>
        </div>
        
        <div className="text-center">
          <p className="text-xs text-slate-400">Last Visit</p>
          <p className="text-sm font-medium text-white">{client.lastVisit || 'N/A'}</p>
        </div>
      </div>
    </div>
  )
}
