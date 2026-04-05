'use client'

import { useState } from 'react'
import { Clock } from 'lucide-react'

interface AvailabilityToggleProps {
  staffId: string
  initialAvailable?: boolean
  onToggle?: (available: boolean) => void
}

export default function AvailabilityToggle({ staffId, initialAvailable = true, onToggle }: AvailabilityToggleProps) {
  const [available, setAvailable] = useState(initialAvailable)

  const handleToggle = () => {
    const newState = !available
    setAvailable(newState)
    onToggle?.(newState)
  }

  return (
    <button
      onClick={handleToggle}
      className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
        available 
          ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' 
          : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
      }`}
    >
      <Clock className="h-3 w-3" />
      {available ? 'Available' : 'Unavailable'}
    </button>
  )
}
