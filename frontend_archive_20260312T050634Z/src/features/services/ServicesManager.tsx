import { useEffect, useMemo, useState } from 'react'
import { Scissors, Plus, Search, ChevronRight, Clock, DollarSign, Tag } from 'lucide-react'
import { glass, semantic, component } from '../../lib/design-tokens'
import OwnerLayout from '../../components/layout/OwnerLayout'

interface Service {
  id: string
  name: string
  category: string
  duration_minutes: number
  price: number
  is_active: boolean
  description?: string
}

const mockServices: Service[] = [
  { id: '1', name: 'Balayage', category: 'Color', duration_minutes: 120, price: 250, is_active: true, description: 'Hand-painted highlights for natural dimension' },
  { id: '2', name: 'Haircut & Style', category: 'Cuts', duration_minutes: 60, price: 85, is_active: true, description: 'Precision cut with blowout styling' },
  { id: '3', name: 'Full Color', category: 'Color', duration_minutes: 90, price: 150, is_active: true, description: 'Single-process color application' },
  { id: '4', name: 'Deep Conditioning', category: 'Treatments', duration_minutes: 45, price: 65, is_active: true, description: 'Intensive moisture repair treatment' },
  { id: '5', name: 'Blowout', category: 'Styling', duration_minutes: 45, price: 55, is_active: false, description: 'Professional blowout styling' },
]

const categories = ['All', 'Color', 'Cuts', 'Treatments', 'Styling']

function ServiceCard({ service, isSelected, onSelect }: {
  service: Service
  isSelected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-2xl border p-4 text-left transition-all ${
        isSelected
          ? 'border-emerald-300/40 bg-emerald-400/10'
          : `${semantic.border.default} bg-white/[0.03] hover:${glass.default}`
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-white">{service.name}</p>
          <p className="text-sm text-zinc-400">{service.category || 'General'} • {service.duration_minutes} min</p>
        </div>
        <div className="text-right">
          <p className="font-semibold text-emerald-200">${service.price.toFixed(0)}</p>
          <p className={`text-[11px] uppercase tracking-[0.18em] ${service.is_active ? 'text-zinc-400' : 'text-zinc-600'}`}>
            {service.is_active ? 'Active' : 'Archived'}
          </p>
        </div>
      </div>
    </button>
  )
}

function ServiceDetail({ service }: { service: Service }) {
  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-base font-semibold text-white">{service.name}</h4>
        <p className="mt-1 text-sm text-zinc-400">{service.description || 'No description provided.'}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-3">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <Clock className="h-3 w-3" />
            Duration
          </div>
          <div className="mt-1 text-lg font-semibold text-white">{service.duration_minutes} min</div>
        </div>
        <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-3">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <DollarSign className="h-3 w-3" />
            Price
          </div>
          <div className="mt-1 text-lg font-semibold text-white">${service.price.toFixed(0)}</div>
        </div>
        <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-3">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <Tag className="h-3 w-3" />
            Category
          </div>
          <div className="mt-1 text-lg font-semibold text-white">{service.category}</div>
        </div>
      </div>
      <div className="flex gap-2">
        <button className="rounded-xl bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-300 hover:bg-emerald-500/20 transition-colors">
          Edit Service
        </button>
        <button className={`rounded-xl border ${semantic.border.default} px-4 py-2 text-sm text-zinc-300 hover:bg-white/[0.04] transition-colors`}>
          {service.is_active ? 'Archive' : 'Restore'}
        </button>
      </div>
    </div>
  )
}

export default function ServicesManager() {
  const [services, setServices] = useState<Service[]>(mockServices)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadServices = async () => {
    setLoading(true)
    setError(null)
    try {
      await new Promise((resolve) => setTimeout(resolve, 500))
      setServices(mockServices)
    } catch (err) {
      setError('Failed to load services')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadServices()
  }, [])

  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      const matchesSearch = !search || service.name.toLowerCase().includes(search.toLowerCase())
      const matchesCategory = categoryFilter === 'All' || service.category === categoryFilter
      return matchesSearch && matchesCategory
    })
  }, [services, search, categoryFilter])

  const selectedService = services.find((s) => s.id === selectedId) || null

  return (
    <OwnerLayout
      title="Service Catalog"
      subtitle="Manage your service offerings, pricing, and availability."
    >
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Service List */}
        <section className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
              Services ({filteredServices.length})
            </h3>
            <button className="flex items-center gap-1 rounded-xl bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-500/20 transition-colors">
              <Plus className="h-3 w-3" />
              Add Service
            </button>
          </div>

          {/* Search and Filter */}
          <div className="mb-4 flex flex-col gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search services"
                className={`w-full rounded-2xl border ${semantic.border.default} bg-zinc-950/60 pl-10 pr-3 py-2 text-sm text-white outline-none`}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
                    categoryFilter === cat
                      ? 'bg-emerald-500/10 text-emerald-300'
                      : 'bg-white/[0.03] text-zinc-400 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {loading ? <p className="mt-4 text-sm text-zinc-400">Loading services...</p> : null}
          {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}

          <div className="space-y-3">
            {filteredServices.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                isSelected={service.id === selectedId}
                onSelect={() => setSelectedId(service.id)}
              />
            ))}
            {!loading && filteredServices.length === 0 ? (
              <p className="text-sm text-zinc-500">No services found.</p>
            ) : null}
          </div>
        </section>

        {/* Service Detail */}
        <section className="lg:col-span-3">
          {selectedService ? (
            <div className={`${component.card} p-6`}>
              <ServiceDetail service={selectedService} />
            </div>
          ) : (
            <div className={`${component.card} flex h-full items-center justify-center p-8`}>
              <div className="text-center">
                <Scissors className="mx-auto h-12 w-12 text-zinc-600" />
                <p className="mt-4 text-sm text-zinc-500">Select a service to view details</p>
              </div>
            </div>
          )}
        </section>
      </div>
    </OwnerLayout>
  )
}
