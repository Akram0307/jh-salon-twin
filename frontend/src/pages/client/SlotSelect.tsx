import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CalendarDays, Clock3, MessageCircle, CalendarHeart, Phone } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getSlots } from '../../services/api'
import { getTodayDate, resolveClientSalonId } from './bookingConfig'
import { glass, semantic, component } from '../../lib/design-tokens';

type SlotRecord = {
  start?: string
  time?: string
  staff_name?: string
}

export default function SlotSelect() {
  const [params] = useSearchParams()
  const salonId = resolveClientSalonId(params.get('salonId'))
  const serviceId = params.get('serviceId')
  const serviceName = params.get('serviceName') || 'Selected service'
  const price = params.get('price') || ''
  const [slots, setSlots] = useState<SlotRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    if (!salonId || !serviceId) {
      setIsLoading(false)
      return
    }

    getSlots(salonId, serviceId, getTodayDate())
      .then((res) => {
        const resObj = res as { slots?: unknown[]; data?: { slots?: unknown[] } } | null
        const next = Array.isArray(resObj?.slots) ? resObj.slots : Array.isArray(resObj?.data?.slots) ? resObj.data.slots : []
        setSlots(next as SlotRecord[])
      })
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [salonId, serviceId])

  const dateLabel = useMemo(() => {
    return new Intl.DateTimeFormat('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(new Date())
  }, [])

  const formatSlot = (slot: SlotRecord) => {
    if (slot.time) return slot.time
    if (!slot.start) return 'Available slot'
    try {
      return new Date(slot.start).toLocaleString('en-IN', {
        hour: 'numeric',
        minute: '2-digit',
        day: 'numeric',
        month: 'short',
      })
    } catch {
      return slot.start
    }
  }

  const goBackToServices = () => {
    navigate('/client/services')
  }

  const goToChat = () => {
    navigate('/client')
  }

  const goToMemberships = () => {
    navigate('/client/memberships')
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#2a1d55_0%,#141220_42%,#0a0a12_100%)] px-4 py-5 text-white">
      <div className="mx-auto max-w-md">
        <div className="mb-4 rounded-[28px] border semantic.border.default bg-white/[0.08] p-4 backdrop-blur-lg">
          <button type="button" onClick={() => navigate('/client/services')} className="mb-4 inline-flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" /> Change service
          </button>
          <p className="text-xs uppercase tracking-[0.24em] text-white/45">Choose time</p>
          <h2 className="text-xl font-semibold">Available appointments</h2>
          <p className="mt-1 text-sm text-white/60">{serviceName}</p>
          <div className="mt-3 flex items-center gap-2 text-sm text-white/60"><CalendarDays className="h-4 w-4" /> {dateLabel}</div>
        </div>

        <div className="space-y-3">
          {isLoading && (
            <div className="rounded-3xl border semantic.border.default bg-white/8 p-8 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-fuchsia-500" />
              <p className="mt-3 text-sm text-white/70">Loading live slots…</p>
            </div>
          )}

          {!isLoading && slots.length === 0 && (
            <div className="rounded-[28px] border semantic.border.default bg-white/[0.08] p-6 backdrop-blur-lg">
              <div className="mb-4 text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full glass.subtle">
                  <CalendarDays className="h-7 w-7 text-white/50" />
                </div>
                <h3 className="text-lg font-semibold text-white">No slots available today</h3>
                <p className="mt-1 text-sm text-white/60">Don't miss out — explore other ways to book!</p>
              </div>
              
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={goBackToServices}
                  className="w-full rounded-2xl border border-fuchsia-500/30 bg-fuchsia-500/10 p-4 text-left transition hover:bg-fuchsia-500/20"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-fuchsia-500/20 p-2">
                      <CalendarHeart className="h-5 w-5 text-fuchsia-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white">Try Another Service</p>
                      <p className="text-xs text-white/60">Browse our full service list</p>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={goToChat}
                  className="w-full rounded-2xl border border-pink-500/30 bg-pink-500/10 p-4 text-left transition hover:bg-pink-500/20"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-pink-500/20 p-2">
                      <MessageCircle className="h-5 w-5 text-pink-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white">Chat with AI Stylist</p>
                      <p className="text-xs text-white/60">Get personalized availability help</p>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={goToMemberships}
                  className="w-full rounded-2xl border semantic.border.default glass.subtle p-4 text-left transition hover:glass.default"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl glass.default p-2">
                      <Phone className="h-5 w-5 text-white/70" />
                    </div>
                    <div>
                      <p className="font-medium text-white">Call the Salon</p>
                      <p className="text-xs text-white/60">Speak directly for special bookings</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {slots.map((slot, index) => {
            const slotValue = slot.start || slot.time || ''
            const next = new URLSearchParams({
              salonId,
              serviceId: serviceId || '',
              serviceName,
              slot: slotValue,
              price,
            })
            return (
              <button
                key={`${slotValue || 'slot'}-${index}`}
                type="button"
                onClick={() => navigate(`/client/confirm?${next.toString()}`)}
                className="w-full rounded-[28px] border semantic.border.default bg-white/[0.08] p-4 text-left shadow-xl backdrop-blur-lg transition hover:bg-white/[0.12] hover:border-white/20"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-white">{formatSlot(slot)}</p>
                    <p className="mt-1 text-sm text-white/55">{slot.staff_name || 'Any stylist available'}</p>
                  </div>
                  <div className="rounded-full border border-emerald-300/20 bg-emerald-400/15 px-3 py-1 text-xs font-medium text-emerald-100">
                    Recommended
                  </div>
                </div>
                <div className="mt-3 inline-flex items-center gap-2 text-sm text-white/65"><Clock3 className="h-4 w-4" /> Tap to confirm</div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
