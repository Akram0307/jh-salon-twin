import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiFetch } from '../../core/api/client'
import { WALKIN_CLIENT_NAME, WALKIN_CLIENT_PHONE } from './bookingConfig'

export default function BookingConfirm() {
  const { salonId, clientId, serviceId, slot, staffId } = useParams()
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const book = async () => {
    if (!serviceId || !slot || !salonId) return
    setIsSubmitting(true)
    setError(null)
    try {
      const client = await apiFetch<{ id: string }>('/api/clients', {
        method: 'POST',
        body: JSON.stringify({
          salon_id: salonId,
          phone_number: WALKIN_CLIENT_PHONE,
          full_name: WALKIN_CLIENT_NAME,
        }),
      })

      const response = await apiFetch<{ id: string }>('/api/bookings', {
        method: 'POST',
        body: JSON.stringify({
          salon_id: salonId,
          client_id: client.id,
          service_id: serviceId,
          slot_start: slot,
          staff_id: staffId,
        }),
      })

      navigate(`/client/${salonId}/booking/${response.id}/success`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Booking failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      <h1 className="text-2xl font-bold mb-6">Confirm Booking</h1>
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-4 rounded-lg mb-4">
          {error}
        </div>
      )}
      <button
        onClick={book}
        disabled={isSubmitting}
        className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-semibold py-3 rounded-lg"
      >
        {isSubmitting ? 'Booking...' : 'Confirm Booking'}
      </button>
    </div>
  )
}
