'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, User, Scissors, DollarSign, Phone, Mail, MapPin, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

interface AppointmentDetailModalProps {
  appointment: {
    id?: string
    clientName?: string
    clientPhone?: string
    clientEmail?: string
    serviceName?: string
    staffName?: string
    date?: string
    time?: string
    duration?: number
    price?: number
    status?: 'confirmed' | 'pending' | 'cancelled' | 'completed'
    notes?: string
    location?: string
  }
  onClose?: () => void
  onStatusChange?: (status: string) => void
}

export default function AppointmentDetailModal({ appointment, onClose, onStatusChange }: AppointmentDetailModalProps) {
  const [open, setOpen] = useState(true)

  const handleClose = () => {
    setOpen(false)
    onClose?.()
  }

  const handleStatusChange = (status: string) => {
    onStatusChange?.(status)
    handleClose()
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'confirmed': return 'text-emerald-400'
      case 'pending': return 'text-yellow-400'
      case 'cancelled': return 'text-red-400'
      case 'completed': return 'text-blue-400'
      default: return 'text-slate-400'
    }
  }

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="h-4 w-4" />
      case 'pending': return <AlertCircle className="h-4 w-4" />
      case 'cancelled': return <XCircle className="h-4 w-4" />
      case 'completed': return <CheckCircle className="h-4 w-4" />
      default: return <AlertCircle className="h-4 w-4" />
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/60" onClick={handleClose} />
      <div className="relative z-50 w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Appointment Details</h2>
          <button
            onClick={handleClose}
            className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <span className="sr-only">Close</span>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {/* Client Info */}
          <div className="rounded-lg bg-slate-800/50 p-4">
            <h3 className="text-sm font-medium text-slate-400 mb-3">Client Information</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-slate-500" />
                <span className="text-white">{appointment.clientName || 'Unknown Client'}</span>
              </div>
              {appointment.clientPhone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-slate-500" />
                  <span className="text-slate-300">{appointment.clientPhone}</span>
                </div>
              )}
              {appointment.clientEmail && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-slate-500" />
                  <span className="text-slate-300">{appointment.clientEmail}</span>
                </div>
              )}
            </div>
          </div>

          {/* Appointment Info */}
          <div className="rounded-lg bg-slate-800/50 p-4">
            <h3 className="text-sm font-medium text-slate-400 mb-3">Appointment Details</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Scissors className="h-4 w-4 text-slate-500" />
                <span className="text-white">{appointment.serviceName || 'Unknown Service'}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-slate-500" />
                <span className="text-slate-300">with {appointment.staffName || 'Unassigned'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-500" />
                <span className="text-slate-300">{appointment.date || 'No date'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-500" />
                <span className="text-slate-300">{appointment.time || 'No time'} ({appointment.duration || 0} min)</span>
              </div>
              {appointment.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-slate-500" />
                  <span className="text-slate-300">{appointment.location}</span>
                </div>
              )}
            </div>
          </div>

          {/* Status & Price */}
          <div className="flex items-center justify-between rounded-lg bg-slate-800/50 p-4">
            <div className="flex items-center gap-2">
              <span className={`flex items-center gap-1 ${getStatusColor(appointment.status)}`}>
                {getStatusIcon(appointment.status)}
                <span className="text-sm font-medium capitalize">{appointment.status || 'unknown'}</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-slate-500" />
              <span className="text-white font-mono">${(appointment.price || 0).toLocaleString()}</span>
            </div>
          </div>

          {/* Notes */}
          {appointment.notes && (
            <div className="rounded-lg bg-slate-800/50 p-4">
              <h3 className="text-sm font-medium text-slate-400 mb-2">Notes</h3>
              <p className="text-sm text-slate-300">{appointment.notes}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Close
            </Button>
            {appointment.status === 'pending' && (
              <>
                <Button
                  onClick={() => handleStatusChange('confirmed')}
                  className="flex-1 bg-emerald-500 text-white hover:bg-emerald-400"
                >
                  Confirm
                </Button>
                <Button
                  onClick={() => handleStatusChange('cancelled')}
                  className="flex-1 bg-red-500 text-white hover:bg-red-400"
                >
                  Cancel
                </Button>
              </>
            )}
            {appointment.status === 'confirmed' && (
              <Button
                onClick={() => handleStatusChange('completed')}
                className="flex-1 bg-blue-500 text-white hover:bg-blue-400"
              >
                Mark Complete
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
