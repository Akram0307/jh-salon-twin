import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Clock3, Scissors, Sparkles, Phone, CalendarHeart, Users, MessageCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '../../core/api/client'
import { CLIENT_SALON_ID } from './bookingConfig'
import { glass, semantic, component } from '../../lib/design-tokens';

type ServiceRecord = {
  id: string
  name: string
  description?: string | null
  duration_minutes?: number
  price?: number | string
  category?: string | null
  salon_id?: string
}

export default function ServiceSelect() {
  const [services, setServices] = useState<ServiceRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    apiFetch<{ data?: ServiceRecord[] }>('/api/services')
      .then((res) => {
        if (Array.isArray(res)) setServices(res)
        else if (Array.isArray(res.data)) setServices(res.data)
      })
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  const serviceCount = useMemo(() => services.length, [services])

  const goToSlots = (service: ServiceRecord) => {
    const params = new URLSearchParams({
      salonId: service.salon_id || CLIENT_SALON_ID,
      serviceId: service.id,
      serviceName: service.name,
      price: String(service.price ?? ''),
    })
    navigate(`/client/slots?${params.toString()}`)
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
          <button type="button" onClick={() => navigate('/client')} className="mb-4 inline-flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to chat
          </button>
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-gradient-to-br from-fuchsia-500 via-pink-500 to-orange-400 p-3">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-white/45">Choose service</p>
              <h2 className="text-xl font-semibold">What would you like today?</h2>
              <p className="mt-1 text-sm text-white/60">{serviceCount || '0'} services available for booking</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {isLoading && (
            <div className="rounded-3xl border semantic.border.default bg-white/8 p-8 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-fuchsia-500" />
              <p className="mt-3 text-sm text-white/70">Loading services…</p>
            </div>
          )}

          {!isLoading && services.length === 0 && (
            <div className="rounded-[28px] border semantic.border.default bg-white/[0.08] p-6 backdrop-blur-lg">
              <div className="mb-4 text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full glass.subtle">
                  <Sparkles className="h-7 w-7 text-white/50" />
                </div>
                <h3 className="text-lg font-semibold text-white">No services available right now</h3>
                <p className="mt-1 text-sm text-white/60">But don't worry — we have other ways to help you look your best!</p>
              </div>
              
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={goToChat}
                  className="w-full rounded-2xl border border-fuchsia-500/30 bg-fuchsia-500/10 p-4 text-left transition hover:bg-fuchsia-500/20"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-fuchsia-500/20 p-2">
                      <MessageCircle className="h-5 w-5 text-fuchsia-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white">Chat with our AI Stylist</p>
                      <p className="text-xs text-white/60">Get personalized recommendations</p>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={goToMemberships}
                  className="w-full rounded-2xl border border-pink-500/30 bg-pink-500/10 p-4 text-left transition hover:bg-pink-500/20"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-pink-500/20 p-2">
                      <CalendarHeart className="h-5 w-5 text-pink-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white">View Memberships & Packages</p>
                      <p className="text-xs text-white/60">Exclusive deals for members</p>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={goToChat}
                  className="w-full rounded-2xl border semantic.border.default glass.subtle p-4 text-left transition hover:glass.default"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl glass.default p-2">
                      <Users className="h-5 w-5 text-white/70" />
                    </div>
                    <div>
                      <p className="font-medium text-white">Join Waitlist</p>
                      <p className="text-xs text-white/60">Get notified when slots open up</p>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={goToChat}
                  className="w-full rounded-2xl border semantic.border.default glass.subtle p-4 text-left transition hover:glass.default"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl glass.default p-2">
                      <Phone className="h-5 w-5 text-white/70" />
                    </div>
                    <div>
                      <p className="font-medium text-white">Call the Salon</p>
                      <p className="text-xs text-white/60">Speak directly with our team</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {services.map((service) => (
            <button
              key={service.id}
              type="button"
              onClick={() => goToSlots(service)}
              className="w-full rounded-[28px] border semantic.border.default bg-white/[0.08] p-4 text-left shadow-xl backdrop-blur-lg transition hover:bg-white/[0.12] hover:border-white/20"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <div className="mb-1 inline-flex items-center gap-2 rounded-full border semantic.border.default bg-black/20 px-2.5 py-1 text-[11px] text-white/55">
                    <Scissors className="h-3.5 w-3.5" /> {service.category || 'Salon service'}
                  </div>
                  <h3 className="text-base font-semibold text-white">{service.name}</h3>
                  {service.description && <p className="mt-1 text-sm text-white/60">{service.description}</p>}
                </div>
                <div className="rounded-2xl bg-white px-3 py-2 text-sm font-semibold text-slate-900">
                  ₹{service.price ?? '--'}
                </div>
              </div>
              <div className="flex items-center justify-between text-sm text-white/65">
                <span className="inline-flex items-center gap-2"><Clock3 className="h-4 w-4" /> {service.duration_minutes || 30} mins</span>
                <span className="font-medium text-white">Continue</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
