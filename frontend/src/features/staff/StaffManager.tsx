import { useEffect, useMemo, useState } from 'react'
import { Users, Plus, Search, ChevronRight, Clock, Star, Phone, Mail } from 'lucide-react'
import { glass, semantic, component } from '../../lib/design-tokens'
import OwnerLayout from '../../components/layout/OwnerLayout'

interface StaffMember {
  id: string
  full_name: string
  email: string
  phone: string
  role: string
  specialties: string[]
  rating: number
  status: 'active' | 'inactive' | 'on-leave'
  next_available: string
}

const mockStaff: StaffMember[] = [
  { id: '1', full_name: 'Sarah Johnson', email: 'sarah@salon.com', phone: '(555) 123-4567', role: 'Senior Stylist', specialties: ['Balayage', 'Color', 'Cuts'], rating: 4.9, status: 'active', next_available: '10:00 AM' },
  { id: '2', full_name: 'Michael Chen', email: 'michael@salon.com', phone: '(555) 234-5678', role: 'Stylist', specialties: ['Cuts', 'Beard', 'Styling'], rating: 4.7, status: 'active', next_available: '11:30 AM' },
  { id: '3', full_name: 'Emily Rodriguez', email: 'emily@salon.com', phone: '(555) 345-6789', role: 'Colorist', specialties: ['Color', 'Highlights', 'Treatments'], rating: 4.8, status: 'active', next_available: '2:00 PM' },
  { id: '4', full_name: 'David Kim', email: 'david@salon.com', phone: '(555) 456-7890', role: 'Junior Stylist', specialties: ['Cuts', 'Wash'], rating: 4.5, status: 'on-leave', next_available: 'Next Monday' },
]

const availableRoles = ['Senior Stylist', 'Stylist', 'Colorist', 'Junior Stylist', 'Receptionist', 'Manager']

function StatusBadge({ status }: { status: StaffMember['status'] }) {
  const colors: Record<string, string> = {
    active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    inactive: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
    'on-leave': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  }
  return (
    <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${colors[status]}`}>
      {status.replace('-', ' ')}
    </span>
  )
}

function StaffCard({ member, isSelected, onSelect }: {
  member: StaffMember
  isSelected: boolean
  onSelect: () => void
}) {
  return (
    <div
      className={`rounded-2xl border p-4 transition-all cursor-pointer ${
        isSelected
          ? 'border-emerald-300/40 bg-emerald-400/10'
          : `${semantic.border.default} ${glass.subtle} hover:${glass.default}`
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800 text-sm font-medium text-zinc-300">
            {member.full_name.charAt(0)}
          </div>
          <div>
            <p className="font-medium text-white">{member.full_name}</p>
            <p className="text-xs text-zinc-500">{member.role}</p>
          </div>
        </div>
        <StatusBadge status={member.status} />
      </div>
      <div className="mt-3 flex items-center gap-4 text-xs text-zinc-400">
        <span className="flex items-center gap-1">
          <Star className="h-3 w-3 text-amber-400" />
          {member.rating}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {member.next_available}
        </span>
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {member.specialties.map((s) => (
          <span key={s} className="rounded-md bg-white/[0.04] px-2 py-0.5 text-xs text-zinc-400">
            {s}
          </span>
        ))}
      </div>
    </div>
  )
}

function StaffDetail({ member }: { member: StaffMember }) {
  return (
    <div className={`${component.card} p-6`}>
      <div className="flex items-start gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-800 text-2xl font-semibold text-zinc-300">
          {member.full_name.charAt(0)}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-white">{member.full_name}</h3>
            <StatusBadge status={member.status} />
          </div>
          <p className="mt-1 text-sm text-zinc-400">{member.role}</p>
          <div className="mt-3 flex items-center gap-4 text-sm text-zinc-400">
            <span className="flex items-center gap-1.5">
              <Mail className="h-4 w-4" />
              {member.email}
            </span>
            <span className="flex items-center gap-1.5">
              <Phone className="h-4 w-4" />
              {member.phone}
            </span>
          </div>
        </div>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-4">
          <div className="text-xs text-zinc-500">Rating</div>
          <div className="mt-1 flex items-center gap-1">
            <Star className="h-4 w-4 text-amber-400" />
            <span className="text-lg font-semibold text-white">{member.rating}</span>
          </div>
        </div>
        <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-4">
          <div className="text-xs text-zinc-500">Next Available</div>
          <div className="mt-1 text-lg font-semibold text-white">{member.next_available}</div>
        </div>
        <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-4">
          <div className="text-xs text-zinc-500">Specialties</div>
          <div className="mt-1 text-lg font-semibold text-white">{member.specialties.length}</div>
        </div>
      </div>
      <div className="mt-6">
        <h4 className="text-sm font-medium text-white">Specialties</h4>
        <div className="mt-2 flex flex-wrap gap-2">
          {member.specialties.map((s) => (
            <span key={s} className="rounded-lg bg-emerald-500/10 px-3 py-1 text-sm text-emerald-300">
              {s}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function StaffManager() {
  const [staff, setStaff] = useState<StaffMember[]>(mockStaff)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const loadStaff = async () => {
    setLoading(true)
    setLoadError(null)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500))
      setStaff(mockStaff)
    } catch (err) {
      setLoadError('Failed to load staff')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStaff()
  }, [])

  const filteredStaff = useMemo(() => {
    return staff.filter((member) => {
      const matchesSearch = !search || member.full_name.toLowerCase().includes(search.toLowerCase())
      const matchesRole = roleFilter === 'all' || member.role === roleFilter
      return matchesSearch && matchesRole
    })
  }, [staff, search, roleFilter])

  const selectedMember = staff.find((m) => m.id === selectedId) || null

  return (
    <OwnerLayout
      title="Staff Management"
      subtitle="Manage your team, track performance, and optimize scheduling."
    >
      {/* Search and Filters */}
      <section>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  loadStaff()
                }
              }}
              placeholder="Search by staff name"
              className={`w-full rounded-2xl border ${semantic.border.default} bg-zinc-950/60 pl-10 pr-3 py-2 text-sm text-white outline-none`}
            />
          </div>
          <div className="flex gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className={`min-w-[130px] rounded-2xl border ${semantic.border.default} bg-zinc-950/60 px-3 py-2 text-sm text-white outline-none`}
            >
              <option value="all">All roles</option>
              {availableRoles.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => loadStaff()}
              className={`rounded-2xl border ${semantic.border.default} px-3 py-2 text-sm text-zinc-200`}
            >
              Apply
            </button>
          </div>
        </div>

        {loading ? <p className="mt-4 text-sm text-zinc-400">Loading team...</p> : null}
        {loadError ? <p className="mt-4 text-sm text-rose-300">{loadError}</p> : null}
        {successMessage ? <p className="mt-4 text-sm text-emerald-300">{successMessage}</p> : null}
      </section>

      {/* Staff Grid and Detail */}
      <section>
        <div className="grid gap-6 lg:grid-cols-5">
          {/* Staff List */}
          <div className="lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
                Team ({filteredStaff.length})
              </h3>
              <button className="flex items-center gap-1 rounded-xl bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-500/20 transition-colors">
                <Plus className="h-3 w-3" />
                Add Staff
              </button>
            </div>
            <div className="space-y-3">
              {filteredStaff.map((member) => (
                <StaffCard
                  key={member.id}
                  member={member}
                  isSelected={member.id === selectedId}
                  onSelect={() => setSelectedId(member.id)}
                />
              ))}
            </div>
          </div>

          {/* Staff Detail */}
          <div className="lg:col-span-3">
            {selectedMember ? (
              <StaffDetail member={selectedMember} />
            ) : (
              <div className={`${component.card} flex h-full items-center justify-center p-8`}>
                <div className="text-center">
                  <Users className="mx-auto h-12 w-12 text-zinc-600" />
                  <p className="mt-4 text-sm text-zinc-500">Select a team member to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </OwnerLayout>
  )
}
