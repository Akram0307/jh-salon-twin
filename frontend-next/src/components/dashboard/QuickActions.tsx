'use client'

import { Button } from '@/components/ui/button'
import { CalendarPlus, UserPlus } from 'lucide-react'

export default function QuickActions() {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
      <h3 className="text-white font-semibold mb-4">Quick Actions</h3>

      <div className="flex flex-col gap-3">
        <Button className="bg-gold-500 text-slate-950 hover:bg-gold-400 flex items-center gap-2">
          <CalendarPlus className="h-4 w-4" />
          New Appointment
        </Button>

        <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800 flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Add Client
        </Button>
      </div>
    </div>
  )
}
