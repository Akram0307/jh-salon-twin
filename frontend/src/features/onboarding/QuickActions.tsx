import { motion } from 'framer-motion'
import {
  Eye,
  CalendarCheck,
  MessageSquare,
  BarChart3,
  ArrowUpRight,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'
import { glass, semantic, component } from '../../lib/design-tokens';

interface QuickAction {
  id: string
  label: string
  description: string
  icon: LucideIcon
  accent: string
  onClick: () => void
  badge?: string
}

interface QuickActionsProps {
  onPreviewClientView: () => void
  onTestBookingFlow: () => void
  onSendTestSMS: () => void
  onViewAnalytics: () => void
}

export default function QuickActions({
  onPreviewClientView,
  onTestBookingFlow,
  onSendTestSMS,
  onViewAnalytics,
}: QuickActionsProps) {
  const actions: QuickAction[] = [
    {
      id: 'preview',
      label: 'Preview Client View',
      description: 'See how clients experience your salon',
      icon: Eye,
      accent: 'text-sky-300',
      onClick: onPreviewClientView,
      badge: 'New',
    },
    {
      id: 'test-booking',
      label: 'Test Booking Flow',
      description: 'Verify the complete booking journey',
      icon: CalendarCheck,
      accent: 'text-emerald-300',
      onClick: onTestBookingFlow,
    },
    {
      id: 'test-sms',
      label: 'Send Test SMS',
      description: 'Check notification delivery',
      icon: MessageSquare,
      accent: 'text-violet-300',
      onClick: onSendTestSMS,
    },
    {
      id: 'analytics',
      label: 'View Analytics',
      description: 'Early insights from your setup',
      icon: BarChart3,
      accent: 'text-amber-300',
      onClick: onViewAnalytics,
    },
  ]

  return (
    <div className="rounded-[28px] border semantic.border.default bg-zinc-900/70 p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-5">
        <Sparkles className="h-4 w-4 text-emerald-300" />
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
          Quick Actions
        </h3>
      </div>

      <div className="space-y-3">
        {actions.map((action, index) => {
          const Icon = action.icon
          return (
            <motion.button
              key={action.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              whileHover={{ scale: 1.02, x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={action.onClick}
              className="group w-full rounded-2xl border semantic.border.subtle bg-white/[0.03] p-4 text-left transition-all duration-200 hover:semantic.border.strong hover:bg-white/[0.06]"
            >
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border semantic.border.default glass.default transition-colors group-hover:glass.strong`}
                >
                  <Icon className={`h-5 w-5 ${action.accent}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">
                      {action.label}
                    </span>
                    {action.badge && (
                      <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
                        {action.badge}
                      </span>
                    )}
                    <ArrowUpRight className="h-3.5 w-3.5 text-zinc-600 opacity-0 transition-all group-hover:text-zinc-400 group-hover:opacity-100" />
                  </div>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {action.description}
                  </p>
                </div>
              </div>
            </motion.button>
          )
        })}
      </div>

      {/* Beta badge */}
      <div className="mt-5 rounded-xl border border-amber-400/15 bg-amber-400/5 p-3">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-300">
            Beta Program
          </span>
        </div>
        <p className="mt-1.5 text-xs text-zinc-400 leading-relaxed">
          You're part of the exclusive Beta Salon Program. Your feedback shapes SalonOS.
        </p>
      </div>
    </div>
  )
}
