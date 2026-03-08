import { useEffect, useMemo, useState } from 'react'
import { asArray, createService, getServices, ServiceRecord, updateService } from '../../services/api'

type ServiceFormState = {
  name: string
  description: string
  duration_minutes: number
  price: string
  category: string
  is_active: boolean
}

const emptyForm: ServiceFormState = {
  name: '',
  description: '',
  duration_minutes: 60,
  price: '0',
  category: 'General',
  is_active: true,
}

export default function ServicesManager() {
  const [services, setServices] = useState<ServiceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const [form, setForm] = useState<ServiceFormState>(emptyForm)

  async function loadServices() {
    setLoading(true)
    setError('')
    try {
      const response = await getServices()
      const rows = asArray<ServiceRecord>(response)
      setServices(rows)
      if (rows.length && !selectedId) setSelectedId(rows[0].id)
    } catch (err: any) {
      setError(err?.message || 'Failed to load services')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadServices()
  }, [])

  const selectedService = useMemo(
    () => services.find((service) => service.id === selectedId) || null,
    [services, selectedId]
  )

  useEffect(() => {
    if (selectedService) {
      setForm({
        name: selectedService.name || '',
        description: selectedService.description || '',
        duration_minutes: Number(selectedService.duration_minutes || 60),
        price: String(selectedService.price ?? '0'),
        category: selectedService.category || 'General',
        is_active: selectedService.is_active ?? true,
      })
    } else {
      setForm(emptyForm)
    }
  }, [selectedService])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = {
        name: form.name,
        description: form.description,
        duration_minutes: Number(form.duration_minutes),
        price: Number(form.price),
        category: form.category,
        is_active: form.is_active,
      }
      if (selectedService) {
        await updateService(selectedService.id, payload)
      } else {
        await createService(payload)
      }
      await loadServices()
      if (!selectedService) setForm(emptyForm)
    } catch (err: any) {
      setError(err?.message || 'Failed to save service')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
      <section className="rounded-3xl border border-white/10 bg-zinc-950/40 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h4 className="text-base font-semibold text-white">Service catalog</h4>
            <p className="text-sm text-zinc-400">Normalize pricing, duration, and merchandising inputs for reliable booking flows.</p>
          </div>
          <button type="button" onClick={() => setSelectedId('')} className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-sm font-medium text-emerald-200">
            New service
          </button>
        </div>

        {loading ? <p className="mt-4 text-sm text-zinc-400">Loading services…</p> : null}
        {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}

        <div className="mt-4 space-y-3">
          {services.map((service) => {
            const active = service.id === selectedId
            return (
              <button
                key={service.id}
                type="button"
                onClick={() => setSelectedId(service.id)}
                className={[
                  'w-full rounded-2xl border p-4 text-left transition',
                  active ? 'border-emerald-300/40 bg-emerald-400/10' : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.05]',
                ].join(' ')}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-white">{service.name}</p>
                    <p className="text-sm text-zinc-400">{service.category || 'General'} • {service.duration_minutes} min</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-emerald-200">₹{Number(service.price || 0).toFixed(0)}</p>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">{service.is_active ? 'Active' : 'Inactive'}</p>
                  </div>
                </div>
              </button>
            )
          })}
          {!loading && !services.length ? <p className="text-sm text-zinc-500">No services found yet.</p> : null}
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
        <div className="mb-4">
          <h4 className="text-base font-semibold text-white">{selectedService ? 'Edit service' : 'Create service'}</h4>
          <p className="text-sm text-zinc-400">Keep catalog records consistent across booking, POS checkout, and analytics.</p>
        </div>

        <form className="space-y-3" onSubmit={handleSubmit}>
          <label className="block text-sm">
            <span className="mb-1 block text-zinc-300">Service name</span>
            <input className="w-full rounded-2xl border border-white/10 bg-zinc-950/60 px-3 py-2 text-white outline-none" value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} required />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-zinc-300">Description</span>
            <textarea className="min-h-24 w-full rounded-2xl border border-white/10 bg-zinc-950/60 px-3 py-2 text-white outline-none" value={form.description} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block text-zinc-300">Duration (minutes)</span>
              <input type="number" min={5} step={5} className="w-full rounded-2xl border border-white/10 bg-zinc-950/60 px-3 py-2 text-white outline-none" value={form.duration_minutes} onChange={(e) => setForm((s) => ({ ...s, duration_minutes: Number(e.target.value) }))} required />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-zinc-300">Price</span>
              <input type="number" min={0} step={50} className="w-full rounded-2xl border border-white/10 bg-zinc-950/60 px-3 py-2 text-white outline-none" value={form.price} onChange={(e) => setForm((s) => ({ ...s, price: e.target.value }))} required />
            </label>
          </div>
          <label className="block text-sm">
            <span className="mb-1 block text-zinc-300">Category</span>
            <input className="w-full rounded-2xl border border-white/10 bg-zinc-950/60 px-3 py-2 text-white outline-none" value={form.category} onChange={(e) => setForm((s) => ({ ...s, category: e.target.value }))} />
          </label>
          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-zinc-950/40 px-3 py-3 text-sm text-zinc-300">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((s) => ({ ...s, is_active: e.target.checked }))} />
            Visible in booking and POS
          </label>
          <div className="flex flex-wrap gap-3 pt-2">
            <button type="submit" disabled={saving} className="rounded-2xl bg-emerald-400 px-4 py-2 text-sm font-semibold text-zinc-950 disabled:opacity-50">
              {saving ? 'Saving…' : selectedService ? 'Save changes' : 'Create service'}
            </button>
            {selectedService ? (
              <button type="button" onClick={() => setSelectedId('')} className="rounded-2xl border border-white/10 px-4 py-2 text-sm text-zinc-200">
                Create new instead
              </button>
            ) : null}
          </div>
        </form>
      </section>
    </div>
  )
}
