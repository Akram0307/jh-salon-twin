import { useEffect, useMemo, useState } from 'react'
import { asArray, createStaff, getStaff, StaffRecord, updateStaff } from '../../services/api'

type StaffFormState = {
  full_name: string
  email: string
  phone_number: string
  role: string
  is_active: boolean
}

const emptyForm: StaffFormState = {
  full_name: '',
  email: '',
  phone_number: '',
  role: 'stylist',
  is_active: true,
}

export default function StaffManager() {
  const [staff, setStaff] = useState<StaffRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [selectedId, setSelectedId] = useState<string>('')
  const [form, setForm] = useState<StaffFormState>(emptyForm)

  async function loadStaff() {
    setLoading(true)
    setError('')
    try {
      const response = await getStaff()
      const rows = asArray<StaffRecord>(response)
      setStaff(rows)
      if (rows.length && !selectedId) {
        setSelectedId(rows[0].id)
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load staff')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStaff()
  }, [])

  const selectedStaff = useMemo(
    () => staff.find((member) => member.id === selectedId) || null,
    [staff, selectedId]
  )

  useEffect(() => {
    if (selectedStaff) {
      setForm({
        full_name: selectedStaff.full_name || '',
        email: selectedStaff.email || '',
        phone_number: selectedStaff.phone_number || '',
        role: selectedStaff.role || 'stylist',
        is_active: selectedStaff.is_active ?? true,
      })
    } else {
      setForm(emptyForm)
    }
  }, [selectedStaff])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (selectedStaff) {
        await updateStaff(selectedStaff.id, form)
      } else {
        await createStaff(form)
      }
      await loadStaff()
      if (!selectedStaff) {
        setForm(emptyForm)
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to save staff member')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-3xl border border-white/10 bg-zinc-950/40 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h4 className="text-base font-semibold text-white">Team roster</h4>
            <p className="text-sm text-zinc-400">Create and update active team members used by booking, POS, and analytics.</p>
          </div>
          <button
            type="button"
            onClick={() => setSelectedId('')}
            className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-sm font-medium text-emerald-200"
          >
            New staff
          </button>
        </div>

        {loading ? <p className="mt-4 text-sm text-zinc-400">Loading team…</p> : null}
        {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}

        <div className="mt-4 space-y-3">
          {staff.map((member) => {
            const active = member.id === selectedId
            return (
              <button
                key={member.id}
                type="button"
                onClick={() => setSelectedId(member.id)}
                className={[
                  'w-full rounded-2xl border p-4 text-left transition',
                  active ? 'border-emerald-300/40 bg-emerald-400/10' : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.05]',
                ].join(' ')}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-white">{member.full_name}</p>
                    <p className="text-sm text-zinc-400">{member.role || 'stylist'} • {member.email}</p>
                  </div>
                  <span className={[
                    'rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]',
                    member.is_active ? 'bg-emerald-400/15 text-emerald-200' : 'bg-zinc-800 text-zinc-400'
                  ].join(' ')}>
                    {member.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </button>
            )
          })}
          {!loading && !staff.length ? <p className="text-sm text-zinc-500">No staff found for this salon yet.</p> : null}
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
        <div className="mb-4">
          <h4 className="text-base font-semibold text-white">{selectedStaff ? 'Edit staff member' : 'Create staff member'}</h4>
          <p className="text-sm text-zinc-400">Normalize roster data so schedule, booking, and owner reporting stay consistent.</p>
        </div>

        <form className="space-y-3" onSubmit={handleSubmit}>
          <label className="block text-sm">
            <span className="mb-1 block text-zinc-300">Full name</span>
            <input className="w-full rounded-2xl border border-white/10 bg-zinc-950/60 px-3 py-2 text-white outline-none" value={form.full_name} onChange={(e) => setForm((s) => ({ ...s, full_name: e.target.value }))} required />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-zinc-300">Email</span>
            <input type="email" className="w-full rounded-2xl border border-white/10 bg-zinc-950/60 px-3 py-2 text-white outline-none" value={form.email} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} required />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-zinc-300">Phone</span>
            <input className="w-full rounded-2xl border border-white/10 bg-zinc-950/60 px-3 py-2 text-white outline-none" value={form.phone_number} onChange={(e) => setForm((s) => ({ ...s, phone_number: e.target.value }))} />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-zinc-300">Role</span>
            <select className="w-full rounded-2xl border border-white/10 bg-zinc-950/60 px-3 py-2 text-white outline-none" value={form.role} onChange={(e) => setForm((s) => ({ ...s, role: e.target.value }))}>
              <option value="stylist">Stylist</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
              <option value="reception">Reception</option>
            </select>
          </label>
          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-zinc-950/40 px-3 py-3 text-sm text-zinc-300">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((s) => ({ ...s, is_active: e.target.checked }))} />
            Available for booking and operations
          </label>
          <div className="flex flex-wrap gap-3 pt-2">
            <button type="submit" disabled={saving} className="rounded-2xl bg-emerald-400 px-4 py-2 text-sm font-semibold text-zinc-950 disabled:opacity-50">
              {saving ? 'Saving…' : selectedStaff ? 'Save changes' : 'Create staff'}
            </button>
            {selectedStaff ? (
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
