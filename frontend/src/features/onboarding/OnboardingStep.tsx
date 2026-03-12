import { Check, ChevronRight, type LucideIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import { glass, semantic } from '../../lib/design-tokens'

export type StepStatus = 'pending' | 'active' | 'completed' | 'locked'

export interface OnboardingStepData {
  id: string
  number: number
  title: string
  description: string
  icon: LucideIcon
  status: StepStatus
  estimatedTime?: string
  actionLabel?: string
  onAction?: () => void
}

interface OnboardingStepProps {
  step: OnboardingStepData
  isLast: boolean
  onClick?: () => void
}

export default function OnboardingStep({ step, isLast, onClick }: OnboardingStepProps) {
  const StepIcon = step.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: step.number * 0.1 }}
      className="relative"
    >
      {/* Connector line */}
      {!isLast && (
        <div className="absolute left-6 top-16 bottom-0 w-px bg-gradient-to-b from-white/10 to-transparent hidden sm:block" />
      )}

      <div
        className={`rounded-[28px] border p-5 sm:p-6 transition-all duration-300 ${
          step.status === 'active'
            ? 'border-emerald-400/30 bg-zinc-900/80 shadow-[0_0_40px_rgba(16,185,129,0.1)]'
            : step.status === 'completed'
            ? 'border-sky-400/20 bg-zinc-900/70'
            : step.status === 'locked'
            ? 'border-white/[0.04] bg-zinc-900/50 opacity-60'
            : `${semantic.border.default} bg-zinc-900/70`
        }`}
        onClick={step.status !== 'locked' ? (onClick || step.onAction) : undefined}
        role={onClick || step.onAction ? 'button' : undefined}
        tabIndex={onClick || step.onAction ? 0 : undefined}
      >
        <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-5">
          {/* Step number / icon */}
          <div className="flex items-center gap-3 sm:flex-col sm:items-center sm:gap-0">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${
                step.status === 'active'
                  ? 'border-emerald-400/30 bg-emerald-400/10'
                  : step.status === 'completed'
                  ? 'border-sky-400/30 bg-sky-400/10'
                  : step.status === 'locked'
                  ? 'border-white/[0.04] bg-white/[0.02]'
                  : `${semantic.border.default} ${glass.default}`
              }`}
            >
              {step.status === 'completed' ? (
                <Check className="h-5 w-5 text-sky-300" />
              ) : step.status === 'locked' ? (
                <StepIcon className="h-5 w-5 text-zinc-600" />
              ) : (
                <StepIcon
                  className={`h-5 w-5 ${
                    step.status === 'active'
                      ? 'text-emerald-300'
                      : 'text-zinc-500'
                  }`}
                />
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3
                className={`text-base font-semibold ${
                  step.status === 'active'
                    ? 'text-white'
                    : step.status === 'completed'
                    ? 'text-zinc-200'
                    : step.status === 'locked'
                    ? 'text-zinc-500'
                    : 'text-zinc-400'
                }`}
              >
                {step.title}
              </h3>
              {step.status === 'active' && (
                <span className="rounded-full bg-emerald-400/10 px-2 py-0.5 text-xs font-medium text-emerald-300">
                  Current
                </span>
              )}
              {step.status === 'completed' && (
                <span className="rounded-full bg-sky-400/10 px-2 py-0.5 text-xs font-medium text-sky-300">
                  Done
                </span>
              )}
              {step.status === 'locked' && (
                <span className="rounded-full bg-white/[0.04] px-2 py-0.5 text-xs font-medium text-zinc-500">
                  Locked
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-zinc-500">{step.description}</p>
            {step.estimatedTime && step.status !== 'completed' && (
              <p className="mt-2 text-xs text-zinc-600">Est. {step.estimatedTime}</p>
            )}
          </div>

          {/* Action indicator */}
          {(onClick || step.onAction) && step.status !== 'completed' && step.status !== 'locked' && (
            <div className="flex items-center">
              <ChevronRight className="h-5 w-5 text-zinc-600" />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
