import { useEffect, useMemo, useState } from 'react'
import { z } from 'zod'
import {
  asArray,
  createStaff,
  getApiErrorMessage,
  getStaff,
  StaffRecord,
  updateStaff,
} from '../../services/api'

type StaffFormState = {
  full_name: string
  email: string
  phone_number: string
  role: string
  is_active: boolean
}

type StaffFieldErrors = Partial<Record<keyof StaffFormState, string>>
type StaffFilter = 'active' | 'archived' | 'all'

const emptyForm: StaffFormState = {
  full_name: '',
  email: '',
  phone_number: '',
  role: 'stylist',
  is_active: true,
}

const roleOptions = ['stylist', 'manager', 'admin', 'reception'] as const

const normalizeOptionalString = (value: unknown) => {
  if (typeof value !== 'string') return value
  const trimmed = value.trim()
  return trimmed.length ? trimmed : ''
}

const staffFormSchema = z.object({
  full_name: z.string().trim().min(2, 'Full name must be at least 2 characters').max(120, 'Full name is too long'),
  email: z.string().trim().email('Enter a valid email address').transform((value: string) => value.toLowerCase()),
  phone_number: z.preprocess(
    normalizeOptionalString,
    z.union([
      z.literal(''),
      z.string().trim().min(7, 'Phone number must be at least 7 characters').max(32, 'Phone number is too long'),
    ])
  ),
  role: z.string().trim().min(2, 'Role is required').max(60, 'Role is too long'),
  is_active: z.boolean(),
})

function formatDateTime(value?: string) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

function parseFieldErrors(error: unknown): StaffFieldErrors {
  const candidate = error as {
    data?: {
      details?: {
        fieldErrors?: Record<string, string[]>
      }
      error?: string
      message?: string
    }
  }

  const fieldErrors = candidate?.data?.details?.fieldErrors
  if (!fieldErrors || typeof fieldErrors !== 'object') return {}

  const mapped: StaffFieldErrors = {}
  for (const [field, messages] of Object.entries(fieldErrors)) {
    if (Array.isArray(messages) && messages[0]) {
      mapped[field as keyof StaffFormState] = messages[0]
    }
  }
  return mapped
}

export default function StaffManager() {
  const [staff, setStaff] = useState<StaffRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [formError, setFormError] = useState('')
  const [selectedId, setSelectedId] = useState<string>('')
  const [form, setForm] = useState<StaffFormState>(emptyForm)
  const [fieldErrors, setFieldErrors] = useState<StaffFieldErrors>({})
  const [statusFilter, setStatusFilter] = useState<StaffFilter>('active')
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [successMessage, setSuccessMessage] = useState('')

  async function loadStaff(nextSelectedId?: string) {
    setLoading(true)
    setLoadError('')
    try {
      const response = await getStaff({
        status: statusFilter,
        search: search.trim() || undefined,
        role: roleFilter === 'all' ? undefined : roleFilter,
      })
      const rows = asArray<StaffRecord>(response)
      setStaff(rows)

      const desiredId = nextSelectedId ?? selectedId
      if (desiredId && rows.some((member) => member.id === desiredId)) {
        setSelectedId(desiredId)
      } else if (rows.length) {
        setSelectedId(rows[0].id)
      } else {
        setSelectedId('')
      }
    } catch (err: unknown) {
      setLoadError(getApiErrorMessage(err, 'Failed to load staff'))
      setStaff([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStaff()
  }, [statusFilter, roleFilter])

  const selectedStaff = useMemo(
    () => staff.find((member) => member.id === selectedId) || null,
    [staff, selectedId]
  )

  const availableRoles = useMemo(() => {
    const values = new Set<string>(roleOptions)
    for (const member of staff) {
      if (member.role) values.add(member.role)
    }
    return Array.from(values)
  }, [staff])

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
    setFieldErrors({})
    setFormError('')
    setSuccessMessage('')
  }, [selectedStaff])

  function validateForm(nextForm: StaffFormState) {
    const parsed = staffFormSchema.safeParse(nextForm)
    if (parsed.success) {
      setFieldErrors({})
      return { success: true, data: parsed.data }
    }

    const nextErrors: StaffFieldErrors = {}
    for (const issue of parsed.error.issues) {
      const field = issue.path[0]
      if (typeof field === 'string' && !nextErrors[field as keyof StaffFormState]) {
        nextErrors[field as keyof StaffFormState] = issue.message
      }
    }
    setFieldErrors(nextErrors)
    return { success: false as const, errors: nextErrors }
  }

  function updateFormField<K extends keyof StaffFormState>(field: K, value: StaffFormState[K]) {
    setForm((current) => {
      const next = { ...current, [field]: value }
      validateForm(next)
      return next
    })
    setFormError('')
    setSuccessMessage('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setFormError('')
    setSuccessMessage('')

    const validation = validateForm(form)
    if (!validation.success) {
      setSaving(false)
      setFormError('Please fix the highlighted fields before saving.')
      return
    }

    const payload = {
      ...validation.data,
      phone_number: validation.data.phone_number || null,
      role: validation.data.role || 'stylist',
    }

    try {
      const response = selectedStaff
        ? await updateStaff(selectedStaff.id, payload)
        : await createStaff(payload)

      const saved = response?.data
      await loadStaff(saved?.id || selectedStaff?.id)
      setSuccessMessage(selectedStaff ? 'Staff member updated successfully.' : 'Staff member created successfully.')

      if (!selectedStaff) {
        setForm(emptyForm)
        setFieldErrors({})
      }
    } catch (err: any) {
      const status = err?.status
      const nextFieldErrors = parseFieldErrors(err)
      setFieldErrors((current) => ({ ...current, ...nextFieldErrors }))

      if (status === 409) {
        const message = getApiErrorMessage(err, 'Duplicate staff record detected.')
        const lowered = message.toLowerCase()
        if (lowered.includes('email')) nextFieldErrors.email = nextFieldErrors.email || message
        if (lowered.includes('phone')) nextFieldErrors.phone_number = nextFieldErrors.phone_number || message
        setFieldErrors((current) => ({ ...current, ...nextFieldErrors }))
        setFormError(message)
      } else {
        setFormError(getApiErrorMessage(err, 'Failed to save staff member'))
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleArchiveToggle(member: StaffRecord) {
    setSaving(true)
    setFormError('')
    setSuccessMessage('')
    try {
      const response = await updateStaff(member.id, { is_active: !member.is_active })
      await loadStaff(response?.data?.id || member.id)
      setSuccessMessage(member.is_active ? 'Staff member archived successfully.' : 'Staff member reactivated successfully.')
    } catch (err: unknown) {
      setFormError(getApiErrorMessage(err, 'Failed to update staff lifecycle state'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-3xl border border-white/10 bg-zinc-950/40 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h4 className="text-base font-semibold text-white">Team roster</h4>
            <p className="text-sm text-zinc-400">Create, update, archive, and filter team members used by booking, POS, and analytics.</p>
          </div>
          <button
            type="button"
            onClick={() => setSelectedId('')}
            className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-sm font-medium text-emerald-200"
          >
            New staff
          </button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-[auto_1fr_auto]">
          <div className="inline-flex rounded-2xl border border-white/10 bg-white/[0.03] p-1 text-sm">
            {(['active', 'archived', 'all'] as const).map((option) => {
              const active = statusFilter === option
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setStatusFilter(option)}
                  className={[
                    'rounded-xl px-3 py-2 capitalize transition',
                    active ? 'bg-emerald-400 text-zinc-950 font-semibold' : 'text-zinc-300'
                  ].join(' ')}
                >
                  {option}
                </button>
              )
            })}
          </div>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                loadStaff()
              }
            }}
            placeholder="Search by staff name"
            className="w-full rounded-2xl border border-white/10 bg-zinc-950/60 px-3 py-2 text-sm text-white outline-none"
          />

          <div className="flex gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="min-w-[130px] rounded-2xl border border-white/10 bg-zinc-950/60 px-3 py-2 text-sm text-white outline-none"
            >
              <option value="all">All roles</option>
              {availableRoles.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => loadStaff()}
              className="rounded-2xl border border-white/10 px-3 py-2 text-sm text-zinc-200"
            >
              Apply
            </button>
          </div>
        </div>

        {loading ? <p className="mt-4 text-sm text-zinc-400">Loading team…</p> : null}
        {loadError ? <p className="mt-4 text-sm text-rose-300">{loadError}</p> : null}
        {successMessage ? <p className="mt-4 text-sm text-emerald-300">{successMessage}</p> : null}

        <div className="mt-4 space-y-3">
          {staff.map((member) => {
            const active = member.id === selectedId
            return (
              <div
                key={member.id}
                className={[
                  'rounded-2xl border p-4 transition',
                  active ? 'border-emerald-300/40 bg-emerald-400/10' : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.05]',
                ].join(' ')}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <button type="button" onClick={() => setSelectedId(member.id)} className="flex-1 text-left">
                    <div>
                      <p className="font-medium text-white">{member.full_name}</p>
                      <p className="text-sm text-zinc-400">{member.role || 'stylist'} • {member.email}</p>
                      <p className="mt-1 text-xs text-zinc-500">Updated {formatDateTime(member.updated_at)}</p>
                    </div>
                  </button>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={[
                      'rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]',
                      member.is_active ? 'bg-emerald-400/15 text-emerald-200' : 'bg-zinc-800 text-zinc-400'
                    ].join(' ')}>
                      {member.is_active ? 'Active' : 'Archived'}
                    </span>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => handleArchiveToggle(member)}
                      className="rounded-xl border border-white/10 px-3 py-2 text-xs text-zinc-200"
                    >
                      {member.is_active ? 'Archive' : 'Restore'}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
          {!loading && !staff.length ? <p className="text-sm text-zinc-500">No staff matched the current filters.</p> : null}
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
        <div className="mb-4">
          <h4 className="text-base font-semibold text-white">{selectedStaff ? 'Edit staff member' : 'Create staff member'}</h4>
          <p className="text-sm text-zinc-400">Normalize roster data so schedule, booking, and owner reporting stay consistent.</p>
        </div>

        <form className="space-y-3" onSubmit={handleSubmit} noValidate>
          <label className="block text-sm">
            <span className="mb-1 block text-zinc-300">Full name</span>
            <input
              className={[
                'w-full rounded-2xl border bg-zinc-950/60 px-3 py-2 text-white outline-none',
                fieldErrors.full_name ? 'border-rose-400/60' : 'border-white/10'
              ].join(' ')}
              value={form.full_name}
              onChange={(e) => updateFormField('full_name', e.target.value)}
              required
            />
            {fieldErrors.full_name ? <span className="mt-1 block text-xs text-rose-300">{fieldErrors.full_name}</span> : null}
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-zinc-300">Email</span>
            <input
              type="email"
              className={[
                'w-full rounded-2xl border bg-zinc-950/60 px-3 py-2 text-white outline-none',
                fieldErrors.email ? 'border-rose-400/60' : 'border-white/10'
              ].join(' ')}
              value={form.email}
              onChange={(e) => updateFormField('email', e.target.value)}
              required
            />
            {fieldErrors.email ? <span className="mt-1 block text-xs text-rose-300">{fieldErrors.email}</span> : null}
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-zinc-300">Phone</span>
            <input
              className={[
                'w-full rounded-2xl border bg-zinc-950/60 px-3 py-2 text-white outline-none',
                fieldErrors.phone_number ? 'border-rose-400/60' : 'border-white/10'
              ].join(' ')}
              value={form.phone_number}
              onChange={(e) => updateFormField('phone_number', e.target.value)}
            />
            {fieldErrors.phone_number ? <span className="mt-1 block text-xs text-rose-300">{fieldErrors.phone_number}</span> : null}
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-zinc-300">Role</span>
            <select
              className={[
                'w-full rounded-2xl border bg-zinc-950/60 px-3 py-2 text-white outline-none',
                fieldErrors.role ? 'border-rose-400/60' : 'border-white/10'
              ].join(' ')}
              value={form.role}
              onChange={(e) => updateFormField('role', e.target.value)}
            >
              {availableRoles.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
            {fieldErrors.role ? <span className="mt-1 block text-xs text-rose-300">{fieldErrors.role}</span> : null}
          </label>
          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-zinc-950/40 px-3 py-3 text-sm text-zinc-300">
            <input type="checkbox" checked={form.is_active} onChange={(e) => updateFormField('is_active', e.target.checked)} />
            Available for booking and operations
          </label>

          {formError ? <p className="rounded-2xl border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-sm text-rose-200">{formError}</p> : null}
          {selectedStaff ? (
            <p className="text-xs text-zinc-500">Last updated: {formatDateTime(selectedStaff.updated_at)}</p>
          ) : null}

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
