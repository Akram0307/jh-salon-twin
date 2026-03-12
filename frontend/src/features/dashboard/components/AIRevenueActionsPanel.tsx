import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowRight, Bot, CheckCircle2, LoaderCircle, Sparkles, Target } from 'lucide-react'
import { glass, semantic, component } from '../../../lib/design-tokens';

interface ActionItem {
  id: string
  title: string
  description: string
  impact?: string
  tone?: 'success' | 'warning' | 'info'
}

interface ScanResult {
  clientsTargeted?: number
  opportunitiesFound?: number
  campaignsPrepared?: number
  estimatedRevenue?: number
}

function toneClasses(tone: ActionItem['tone']) {
  switch (tone) {
    case 'success':
      return 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200'
    case 'warning':
      return 'border-amber-400/20 bg-amber-400/10 text-amber-200'
    default:
      return 'border-sky-400/20 bg-sky-400/10 text-sky-200'
  }
}

function SummarySkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="rounded-2xl border semantic.border.default glass.default px-4 py-4">
          <div className="h-3 w-24 animate-pulse rounded glass.default" />
          <div className="mt-3 h-7 w-20 animate-pulse rounded glass.default" />
        </div>
      ))}
    </div>
  )
}

export default function AIRevenueActionsPanel() {
  const [actions, setActions] = useState<ActionItem[]>([])
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [runError, setRunError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastScanAt, setLastScanAt] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        setLoadError(null)
        const res = await fetch('/api/revenue/intelligence')
        const json = await res.json()

        const suggestions: ActionItem[] = []

        if (json?.opportunities?.rebookable_clients > 0) {
          suggestions.push({
            id: 'rebook',
            title: 'Rebooking opportunity detected',
            description: `${json.opportunities.rebookable_clients} clients are due for follow-up rebooking outreach.`,
            impact: 'Recover dormant revenue from the existing client base.',
            tone: 'success',
          })
        }

        if (json?.opportunities?.low_capacity_days?.length) {
          suggestions.push({
            id: 'capacity',
            title: 'Low-capacity day approaching',
            description: 'Upcoming schedule density is below target and can be lifted with a focused offer.',
            impact: 'Run a targeted promotion before the gap becomes lost revenue.',
            tone: 'warning',
          })
        }

        if (suggestions.length === 0) {
          suggestions.push({
            id: 'steady',
            title: 'No urgent intervention required',
            description: 'Current signals do not show a major booking or rebooking risk.',
            impact: 'Keep monitoring campaign posture and scan again later today.',
            tone: 'info',
          })
        }

        setActions(suggestions)
      } catch (e) {
        console.error('AI actions failed', e)
        setLoadError('Revenue action signals are temporarily unavailable.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  async function runRevenueScan() {
    try {
      setRunning(true)
      setRunError(null)
      setResult(null)

      const res = await fetch('/api/revenue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salonId: 'demo-salon',
          action: 'scan_opportunities',
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json?.error || 'Revenue scan failed')
      }

      const parsed: ScanResult = {
        clientsTargeted: json?.clientsTargeted || json?.targets || 0,
        opportunitiesFound: json?.opportunities || 0,
        campaignsPrepared: json?.campaigns || 0,
        estimatedRevenue: json?.estimatedRevenue || 0,
      }

      setResult(parsed)
      setLastScanAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
    } catch (err) {
      console.error('Revenue scan failed', err)
      setRunError(err instanceof Error ? err.message : 'Revenue scan failed')
    } finally {
      setRunning(false)
    }
  }

  const summary = useMemo(() => {
    if (!result) return null
    return [
      { label: 'Clients targeted', value: result.clientsTargeted ?? 0 },
      { label: 'Opportunities found', value: result.opportunitiesFound ?? 0 },
      { label: 'Campaigns prepared', value: result.campaignsPrepared ?? 0 },
      { label: 'Estimated revenue', value: `₹${result.estimatedRevenue ?? 0}` },
    ]
  }, [result])

  return (
    <section className="relative overflow-hidden rounded-[28px] border semantic.border.default bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.03))] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-sm sm:p-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.16),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.05),transparent_40%)]" />

      <div className="relative space-y-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-200">
              <Bot className="h-3.5 w-3.5" />
              <span>AI revenue actions</span>
            </div>
            <h3 className="mt-4 text-xl font-semibold tracking-tight text-white sm:text-2xl">Turn intelligence into revenue recovery</h3>
            <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-400">
              Surface the most valuable intervention opportunities, trigger a scan, and convert weak demand windows into action.
            </p>
          </div>

          <div className="flex flex-col items-stretch gap-2 sm:items-end">
            <button
              onClick={runRevenueScan}
              disabled={running}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-black transition duration-200 hover:-translate-y-0.5 hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {running ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              <span>{running ? 'Scanning revenue…' : 'Run revenue scan'}</span>
            </button>
            <div className="text-xs text-zinc-500">{lastScanAt ? `Last scan ${lastScanAt}` : 'No manual scan yet'}</div>
          </div>
        </div>

        {running && !summary ? <SummarySkeleton /> : null}

        {summary ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {summary.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border semantic.border.default glass.default px-4 py-4 transition duration-200 hover:semantic.border.strong hover:bg-white/[0.055]"
              >
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">{item.label}</div>
                <div className="mt-2 text-xl font-semibold text-white">{item.value}</div>
              </div>
            ))}
          </div>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-3">
            {loadError ? (
              <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm text-amber-100">
                <div className="flex items-center gap-2 font-medium">
                  <AlertTriangle className="h-4 w-4" />
                  <span>{loadError}</span>
                </div>
              </div>
            ) : null}

            {runError ? (
              <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm text-rose-100">
                <div className="flex items-center gap-2 font-medium">
                  <AlertTriangle className="h-4 w-4" />
                  <span>{runError}</span>
                </div>
              </div>
            ) : null}

            {result && !runError ? (
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
                <div className="flex items-center gap-2 font-medium">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Revenue scan completed successfully.</span>
                </div>
              </div>
            ) : null}

            {loading ? (
              Array.from({ length: 2 }).map((_, index) => (
                <div key={index} className="rounded-[24px] border semantic.border.default glass.default p-4 sm:p-5">
                  <div className="flex flex-col gap-3">
                    <div className="h-6 w-32 animate-pulse rounded-full glass.default" />
                    <div className="h-5 w-2/3 animate-pulse rounded glass.default" />
                    <div className="h-4 w-full animate-pulse rounded glass.default" />
                    <div className="h-4 w-4/5 animate-pulse rounded glass.default" />
                  </div>
                </div>
              ))
            ) : (
              actions.map((a) => (
                <div
                  key={a.id}
                  className="rounded-[24px] border semantic.border.default glass.default p-4 transition duration-200 hover:semantic.border.strong hover:bg-white/[0.055] sm:p-5"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${toneClasses(a.tone)}`}>
                        <Target className="h-3.5 w-3.5" />
                        <span>{a.tone === 'warning' ? 'Capacity risk' : a.tone === 'success' ? 'Revenue lift' : 'Monitoring'}</span>
                      </div>
                      <div className="mt-3 text-base font-semibold text-white">{a.title}</div>
                      <div className="mt-2 text-sm leading-6 text-zinc-400">{a.description}</div>
                      {a.impact ? <div className="mt-3 text-sm text-zinc-300">{a.impact}</div> : null}
                    </div>

                    <div className="inline-flex items-center gap-2 text-sm font-medium text-emerald-300 transition duration-200 group-hover:translate-x-0.5">
                      <span>Review</span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="rounded-[24px] border semantic.border.default glass.default p-5 transition duration-200 hover:semantic.border.strong hover:bg-white/[0.055]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">Operator guidance</div>
            <h4 className="mt-2 text-lg font-semibold text-white">Recommended command pattern</h4>
            <div className="mt-4 space-y-3 text-sm leading-6 text-zinc-400">
              <p>1. Run a scan when same-day capacity softens or rebooking activity drops.</p>
              <p>2. Review the highlighted recovery path before triggering campaign workflows.</p>
              <p>3. Use this panel as the owner override surface for AI-driven revenue action.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
