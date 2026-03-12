import { useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, LoaderCircle, PauseCircle, PlayCircle, RadioTower, Sparkles } from 'lucide-react'
import { glass, semantic, component } from '../../../lib/design-tokens';

interface Campaign {
  id: string
  name: string
  status: 'active' | 'paused'
  messagesSent: number
  conversions: number
  revenueRecovered: number
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border semantic.border.default glass.default px-4 py-4 transition duration-200 hover:semantic.border.strong hover:bg-white/[0.055]">
      <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">{label}</div>
      <div className="mt-2 text-lg font-semibold text-white">{value}</div>
    </div>
  )
}

export default function AICampaignControlPanel() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    async function loadCampaigns() {
      try {
        setError(null)
        const res = await fetch('/api/ai/campaigns')
        const json = await res.json()
        setCampaigns(json?.campaigns || [])
      } catch (err) {
        console.error('Failed to load campaigns', err)
        setError('Campaign telemetry is temporarily unavailable.')
      } finally {
        setLoading(false)
      }
    }

    loadCampaigns()
  }, [])

  async function toggleCampaign(id: string, status: 'active' | 'paused') {
    try {
      setBusyId(id)
      setError(null)
      const newStatus = status === 'active' ? 'paused' : 'active'

      const res = await fetch(`/api/ai/campaigns/${id}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!res.ok) {
        throw new Error('Campaign toggle failed')
      }

      setCampaigns((prev) => prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c)))
    } catch (err) {
      console.error('Campaign toggle failed', err)
      setError(err instanceof Error ? err.message : 'Campaign toggle failed')
    } finally {
      setBusyId(null)
    }
  }

  const summary = useMemo(() => {
    const active = campaigns.filter((c) => c.status === 'active').length
    const paused = campaigns.filter((c) => c.status === 'paused').length
    const messages = campaigns.reduce((sum, c) => sum + (c.messagesSent || 0), 0)
    const recovered = campaigns.reduce((sum, c) => sum + (c.revenueRecovered || 0), 0)
    return { active, paused, messages, recovered }
  }, [campaigns])

  return (
    <section className="rounded-[28px] border semantic.border.default bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.03))] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-sm sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-200">
            <RadioTower className="h-3.5 w-3.5" />
            <span>AI campaign engine</span>
          </div>
          <h3 className="mt-4 text-xl font-semibold tracking-tight text-white">Campaign posture and recovery flow</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
            Monitor live campaign throughput, pause or resume automations, and keep the salon’s outbound revenue engine under control.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border semantic.border.default glass.default px-3 py-2 text-xs text-zinc-300">
          {loading ? <LoaderCircle className="h-3.5 w-3.5 animate-spin text-emerald-300" /> : <Sparkles className="h-3.5 w-3.5 text-emerald-300" />}
          <span>{loading ? 'Syncing campaigns…' : 'Live automation monitor'}</span>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Active" value={summary.active} />
        <Stat label="Paused" value={summary.paused} />
        <Stat label="Messages sent" value={summary.messages} />
        <Stat label="Revenue recovered" value={`₹${summary.recovered}`} />
      </div>

      <div className="mt-5 space-y-4">
        {error ? (
          <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm text-rose-100">
            <div className="flex items-center gap-2 font-medium">
              <AlertTriangle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          </div>
        ) : null}

        {loading ? (
          Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="rounded-[24px] border semantic.border.default glass.default p-5">
              <div className="space-y-3">
                <div className="h-5 w-40 animate-pulse rounded glass.default" />
                <div className="h-6 w-24 animate-pulse rounded-full glass.default" />
                <div className="grid gap-3 sm:grid-cols-3">
                  {Array.from({ length: 3 }).map((__, statIndex) => (
                    <div key={statIndex} className="rounded-2xl border semantic.border.default glass.default px-4 py-4">
                      <div className="h-3 w-16 animate-pulse rounded glass.default" />
                      <div className="mt-3 h-6 w-20 animate-pulse rounded glass.default" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        ) : null}

        {!loading && campaigns.length === 0 ? (
          <div className="rounded-[24px] border semantic.border.default glass.default p-5 text-sm leading-6 text-zinc-400">
            No campaigns running. Automation is idle until a recovery workflow is activated.
          </div>
        ) : null}

        {!loading && campaigns.map((c) => {
          const active = c.status === 'active'
          const busy = busyId === c.id
          return (
            <div
              key={c.id}
              className="rounded-[24px] border semantic.border.default glass.default p-5 transition duration-200 hover:semantic.border.strong hover:bg-white/[0.055]"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-base font-semibold text-white">{c.name}</div>
                    <span
                      className={[
                        'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]',
                        active
                          ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200'
                          : 'border-zinc-600/40 bg-zinc-700/40 text-zinc-300',
                      ].join(' ')}
                    >
                      <Activity className="h-3.5 w-3.5" />
                      <span>{c.status}</span>
                    </span>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <Stat label="Messages" value={c.messagesSent} />
                    <Stat label="Conversions" value={c.conversions} />
                    <Stat label="Recovered" value={`₹${c.revenueRecovered}`} />
                  </div>
                </div>

                <button
                  onClick={() => toggleCampaign(c.id, c.status)}
                  disabled={busy}
                  className={[
                    'inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition duration-200',
                    'disabled:cursor-not-allowed disabled:opacity-60',
                    active
                      ? 'bg-zinc-800 text-white hover:-translate-y-0.5 hover:bg-zinc-700'
                      : 'bg-emerald-400 text-black hover:-translate-y-0.5 hover:bg-emerald-300',
                  ].join(' ')}
                >
                  {busy ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : active ? (
                    <PauseCircle className="h-4 w-4" />
                  ) : (
                    <PlayCircle className="h-4 w-4" />
                  )}
                  <span>{busy ? 'Updating…' : active ? 'Pause campaign' : 'Activate campaign'}</span>
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
