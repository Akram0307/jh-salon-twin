import { FormEvent, useEffect, useMemo, useState } from 'react'
import {
  asArray,
  createScheduleRule,
  deleteScheduleRule,
  getScheduleRules,
  getScheduleSummary,
  getStaff,
  ScheduleRuleInput,
  ScheduleRuleRecord,
  ScheduleSummary,
  StaffRecord,
  updateScheduleRule,
} from '../../services/api'

const metricCard = 'rounded-3xl border border-white/10 bg-white/[0.03] p-4'
const surfaceCard = 'rounded-3xl border border-white/10 bg-zinc-950/40 p-4'
const inputClass = 'w-full rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-emerald-400/60 focus:bg-white/[0.06]'
const labelClass = 'text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500'
const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

type FormState = {
  staff_id: string
  weekday: string
  start_time: string
  end_time: string
  capacity: string
  is_active: boolean
}

const initialForm: FormState = {
  staff_id: '',
  weekday: '1',
  start_time: '09:00',
  end_time: '18:00',
  capacity: '1',
  is_active: true,
}

function toPayload(form: FormState): ScheduleRuleInput {
  return {
    staff_id: form.staff_id,
    weekday: Number(form.weekday),
    start_time: form.start_time,
    end_time: form.end_time,
    capacity: Math.max(1, Number(form.capacity || '1')),
    is_active: form.is_active,
  }
}

export default function ScheduleManager() {
  const [summary, setSummary] = useState<ScheduleSummary | null>(null)
  const [rules, setRules] = useState<ScheduleRuleRecord[]>([])
  const [staff, setStaff] = useState<StaffRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')
  const [notice, setNotice] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(initialForm)

  async function loadAll() {
    setLoading(true)
    setError('')
    try {
      const [summaryRes, rulesRes, staffRes] = await Promise.all([
        getScheduleSummary(),
        getScheduleRules(),
        getStaff(),
      ])
      setSummary(summaryRes.data)
      setRules(asArray<ScheduleRuleRecord>(rulesRes.data))
      const normalizedStaff = asArray<StaffRecord>(staffRes.data).filter((member) => member.is_active !== false)
      setStaff(normalizedStaff)
      setForm((current) => ({
        ...current,
        staff_id: current.staff_id || normalizedStaff[0]?.id || '',
      }))
    } catch (err: any) {
      setError(err?.message || 'Failed to load schedule operations')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadAll()
  }, [])

  const groupedRules = useMemo(() => {
    return rules.reduce<Record<string, ScheduleRuleRecord[]>>((acc, rule) => {
      const key = rule.staff_name || 'Unknown staff'
      acc[key] = acc[key] || []
      acc[key].push(rule)
      return acc
    }, {})
  }, [rules])

  function resetForm(nextStaffId?: string) {
    setEditingId(null)
    setFormError('')
    setForm({ ...initialForm, staff_id: nextStaffId ?? staff[0]?.id ?? '' })
  }

  function beginEdit(rule: ScheduleRuleRecord) {
    setEditingId(rule.id)
    setFormError('')
    setNotice('')
    setForm({
      staff_id: rule.staff_id,
      weekday: String(rule.weekday),
      start_time: rule.start_time || '09:00',
      end_time: rule.end_time || '18:00',
      capacity: String(rule.capacity || 1),
      is_active: rule.is_active,
    })
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setFormError('')
    setNotice('')

    if (!form.staff_id || !form.start_time || !form.end_time) {
      setFormError('Select staff and provide a valid start/end time.')
      return
    }
    if (form.start_time >= form.end_time) {
      setFormError('Start time must be earlier than end time.')
      return
    }

    setSaving(true)
    try {
      const payload = toPayload(form)
      if (editingId) {
        await updateScheduleRule(editingId, payload)
        setNotice('Schedule rule updated.')
      } else {
        await createScheduleRule(payload)
        setNotice('Schedule rule created.')
      }
      await loadAll()
      resetForm(form.staff_id)
    } catch (err: any) {
      setFormError(err?.message || 'Failed to save schedule rule')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm('Delete this schedule rule?')
    if (!confirmed) return
    setSaving(true)
    setFormError('')
    setNotice('')
    try {
      await deleteScheduleRule(id)
      setNotice('Schedule rule deleted.')
      await loadAll()
      if (editingId === id) resetForm()
    } catch (err: any) {
      setFormError(err?.message || 'Failed to delete schedule rule')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className={metricCard}>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Active staff</p>
          <p className="mt-2 text-2xl font-semibold text-white">{summary?.staff_count ?? '—'}</p>
        </article>
        <article className={metricCard}>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Hour rules</p>
          <p className="mt-2 text-2xl font-semibold text-white">{summary?.active_hour_rules ?? '—'}</p>
        </article>
        <article className={metricCard}>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Break rules</p>
          <p className="mt-2 text-2xl font-semibold text-white">{summary?.break_rules ?? '—'}</p>
        </article>
        <article className={metricCard}>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Today appointments</p>
          <p className="mt-2 text-2xl font-semibold text-white">{summary?.appointments_today ?? '—'}</p>
        </article>
      </div>

      <section className={surfaceCard}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h4 className="text-base font-semibold text-white">Weekly coverage map</h4>
            <p className="text-sm text-zinc-400">Normalized summary of configured working-hours coverage for operational readiness.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-zinc-300">
            Time off today: <span className="font-semibold text-white">{summary?.staff_time_off_today ?? '—'}</span>
          </div>
        </div>

        {loading ? <p className="mt-4 text-sm text-zinc-400">Loading schedule summary…</p> : null}
        {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
          {(summary?.coverage || []).map((day) => (
            <article key={day.weekday} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-sm font-semibold text-white">{day.day_label}</p>
              <p className="mt-3 text-2xl font-semibold text-emerald-200">{day.staffed_count}</p>
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">staffed</p>
              <div className="mt-3 text-sm text-zinc-400">
                {day.start_time && day.end_time ? `${day.start_time} – ${day.end_time}` : 'No configured hours'}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.05fr,1.4fr]">
        <article className={surfaceCard}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h4 className="text-base font-semibold text-white">{editingId ? 'Edit working-hours rule' : 'Add working-hours rule'}</h4>
              <p className="mt-1 text-sm text-zinc-400">Create staff-level schedule rules used by owner operations and availability intelligence.</p>
            </div>
            {editingId ? (
              <button
                type="button"
                onClick={() => resetForm()}
                className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-200 transition hover:bg-white/10"
              >
                Cancel edit
              </button>
            ) : null}
          </div>

          <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span className={labelClass}>Staff member</span>
                <select
                  className={inputClass}
                  value={form.staff_id}
                  onChange={(event) => setForm((current) => ({ ...current, staff_id: event.target.value }))}
                >
                  <option value="">Select staff</option>
                  {staff.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.full_name}{member.role ? ` — ${member.role}` : ''}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className={labelClass}>Weekday</span>
                <select
                  className={inputClass}
                  value={form.weekday}
                  onChange={(event) => setForm((current) => ({ ...current, weekday: event.target.value }))}
                >
                  {days.map((day, index) => (
                    <option key={day} value={index}>
                      {day}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className={labelClass}>Start time</span>
                <input
                  className={inputClass}
                  type="time"
                  value={form.start_time}
                  onChange={(event) => setForm((current) => ({ ...current, start_time: event.target.value }))}
                />
              </label>

              <label className="space-y-2">
                <span className={labelClass}>End time</span>
                <input
                  className={inputClass}
                  type="time"
                  value={form.end_time}
                  onChange={(event) => setForm((current) => ({ ...current, end_time: event.target.value }))}
                />
              </label>

              <label className="space-y-2">
                <span className={labelClass}>Capacity</span>
                <input
                  className={inputClass}
                  type="number"
                  min="1"
                  step="1"
                  value={form.capacity}
                  onChange={(event) => setForm((current) => ({ ...current, capacity: event.target.value }))}
                />
              </label>

              <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-zinc-200">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(event) => setForm((current) => ({ ...current, is_active: event.target.checked }))}
                />
                Rule is active
              </label>
            </div>

            {formError ? <p className="text-sm text-rose-300">{formError}</p> : null}
            {notice ? <p className="text-sm text-emerald-300">{notice}</p> : null}

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={saving || loading}
                className="rounded-2xl bg-emerald-400 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? 'Saving…' : editingId ? 'Update rule' : 'Create rule'}
              </button>
              <button
                type="button"
                disabled={saving || loading}
                onClick={() => resetForm()}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Reset form
              </button>
            </div>
          </form>
        </article>

        <article className={surfaceCard}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h4 className="text-base font-semibold text-white">Configured working-hours rules</h4>
              <p className="mt-1 text-sm text-zinc-400">Owner-facing CRUD list grouped by team member for quick schedule operations.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-zinc-300">
              Rules: <span className="font-semibold text-white">{rules.length}</span>
            </div>
          </div>

          <div className="mt-4 space-y-4">
            {!loading && rules.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-4 text-sm text-zinc-400">
                No working-hours rules yet. Create the first one using the editor.
              </div>
            ) : null}

            {Object.entries(groupedRules).map(([staffName, staffRules]) => (
              <section key={staffName} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <h5 className="text-sm font-semibold text-white">{staffName}</h5>
                    <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">{staffRules[0]?.staff_role || 'team member'}</p>
                  </div>
                  <div className="text-xs text-zinc-500">{staffRules.length} rule{staffRules.length === 1 ? '' : 's'}</div>
                </div>

                <div className="space-y-3">
                  {staffRules.map((rule) => (
                    <article key={rule.id} className="rounded-2xl border border-white/10 bg-zinc-950/50 p-3">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-medium text-white">
                            {rule.day_label} · {rule.start_time || '—'} – {rule.end_time || '—'}
                          </p>
                          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-zinc-500">
                            Capacity {rule.capacity} · {rule.is_active ? 'Active' : 'Inactive'}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => beginEdit(rule)}
                            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-200 transition hover:bg-white/10"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(rule.id)}
                            className="rounded-xl border border-rose-400/20 bg-rose-400/10 px-3 py-2 text-sm text-rose-200 transition hover:bg-rose-400/20"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </article>
      </section>

      <section className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-4 text-sm text-zinc-400">
        Next hardening step: extend this CRUD layer to staff breaks, time off, blackout dates, and location-wide operating constraints.
      </section>
    </div>
  )
}
