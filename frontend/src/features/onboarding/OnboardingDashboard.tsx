import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2,
  Scissors,
  Users,
  Clock,
  Rocket,
  Sparkles,
  CheckCircle2,
  PartyPopper,
  ArrowRight,
  Store,
  TrendingUp,
  Calendar,
} from 'lucide-react'
import OwnerLayout from '../../components/layout/OwnerLayout'
import OwnerModuleBoundary from '../../components/owner/OwnerModuleBoundary'
import ProgressBar from './ProgressBar'
import OnboardingStep, { type OnboardingStepData, type StepStatus } from './OnboardingStep'
import QuickActions from './QuickActions'
import { glass, semantic, component } from '../../lib/design-tokens';

// Types for onboarding state
interface OnboardingState {
  salonProfile: boolean
  servicesSetup: boolean
  staffManagement: boolean
  businessHours: boolean
  goLive: boolean
  servicesCount: number
  staffCount: number
  nextAvailableSlot: string | null
}

const STORAGE_KEY = 'salonos_onboarding_progress'

const defaultState: OnboardingState = {
  salonProfile: false,
  servicesSetup: false,
  staffManagement: false,
  businessHours: false,
  goLive: false,
  servicesCount: 0,
  staffCount: 0,
  nextAvailableSlot: null,
}

// Celebration animation component
function CelebrationAnimation({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 4000)
    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 20 }}
        className="rounded-[40px] border border-emerald-400/30 bg-zinc-900/95 p-8 sm:p-12 text-center shadow-[0_0_100px_rgba(16,185,129,0.3)]"
      >
        <motion.div
          animate={{ rotate: [0, -10, 10, -10, 10, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 0.8, repeat: 2 }}
          className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-400/20 to-sky-400/20"
        >
          <PartyPopper className="h-12 w-12 text-emerald-300" />
        </motion.div>
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Welcome to SalonOS!
        </h2>
        <p className="mt-4 max-w-md text-lg text-zinc-400">
          Your salon is now live and ready to accept bookings. You've completed the Beta Salon Program setup!
        </p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 flex justify-center gap-4"
        >
          <div className="rounded-2xl border semantic.border.default glass.default px-6 py-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">Status</div>
            <div className="mt-1 flex items-center gap-2 text-emerald-300">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-semibold">Live & Ready</span>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Confetti particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          initial={{
            opacity: 1,
            x: typeof window !== 'undefined' ? window.innerWidth / 2 : 0,
            y: typeof window !== 'undefined' ? window.innerHeight / 2 : 0,
            scale: 0,
          }}
          animate={{
            opacity: 0,
            x: typeof window !== 'undefined' ? Math.random() * window.innerWidth : 0,
            y: typeof window !== 'undefined' ? Math.random() * window.innerHeight : 0,
            scale: Math.random() * 1.5 + 0.5,
            rotate: Math.random() * 720 - 360,
          }}
          transition={{ duration: 2 + Math.random() * 2, ease: 'easeOut' }}
          className="fixed h-3 w-3 rounded-full"
          style={{
            backgroundColor: ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899'][i % 5],
          }}
        />
      ))}
    </motion.div>
  )
}

// Quick stat card component
function QuickStatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Store
  label: string
  value: string | number
  accent: string
}) {
  return (
    <div className="rounded-2xl border semantic.border.default glass.default p-4 transition-all hover:semantic.border.strong hover:bg-white/[0.06]">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
        <Icon className={`h-3.5 w-3.5 ${accent}`} />
        <span>{label}</span>
      </div>
      <div className="mt-2 text-2xl font-bold text-white">{value}</div>
    </div>
  )
}

export default function OnboardingDashboard() {
  const [state, setState] = useState<OnboardingState>(defaultState)
  const [showCelebration, setShowCelebration] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Load state from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setState({ ...defaultState, ...parsed })
      } catch {
        // Invalid stored data, use defaults
      }
    }
    setIsLoading(false)
  }, [])

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    }
  }, [state, isLoading])

  // Calculate progress percentage
  const progress = Math.round(
    ((Number(state.salonProfile) +
      Number(state.servicesSetup) +
      Number(state.staffManagement) +
      Number(state.businessHours) +
      Number(state.goLive)) /
      5) *
      100
  )

  // Check if all steps are complete
  const isComplete = progress === 100

  // Show celebration when complete
  useEffect(() => {
    if (isComplete && !showCelebration && !isLoading) {
      const timer = setTimeout(() => setShowCelebration(true), 500)
      return () => clearTimeout(timer)
    }
  }, [isComplete, showCelebration, isLoading])

  // Step handlers
  const handleStepComplete = useCallback((stepId: string) => {
    setState((prev) => {
      const updates: Partial<OnboardingState> = {}
      switch (stepId) {
        case 'salon-profile':
          updates.salonProfile = true
          break
        case 'services-setup':
          updates.servicesSetup = true
          updates.servicesCount = prev.servicesCount + 1
          break
        case 'staff-management':
          updates.staffManagement = true
          updates.staffCount = prev.staffCount + 1
          break
        case 'business-hours':
          updates.businessHours = true
          updates.nextAvailableSlot = 'Today, 2:00 PM'
          break
        case 'go-live':
          updates.goLive = true
          break
      }
      return { ...prev, ...updates }
    })
  }, [])

  // Quick action handlers
  const handlePreviewClientView = useCallback(() => {
    window.open('/client', '_blank')
  }, [])

  const handleTestBookingFlow = useCallback(() => {
    window.open('/client/services', '_blank')
  }, [])

  const handleSendTestSMS = useCallback(() => {
    alert('Test SMS sent to your registered number!')
  }, [])

  const handleViewAnalytics = useCallback(() => {
    window.location.href = '/owner/reports'
  }, [])

  // Define steps
  const steps: OnboardingStepData[] = [
    {
      id: 'salon-profile',
      number: 1,
      title: 'Salon Profile',
      description: 'Set up your salon name, address, phone number, and upload your logo to establish your brand identity.',
      icon: Building2,
      status: state.salonProfile
        ? 'completed'
        : !state.servicesSetup && !state.staffManagement && !state.businessHours && !state.goLive
        ? 'active'
        : 'pending',
      estimatedTime: '3 min',
      actionLabel: state.salonProfile ? 'Completed' : 'Configure',
      onAction: () => {
        if (!state.salonProfile) {
          // Navigate to settings or open modal
          window.location.href = '/owner/settings'
        }
      },
    },
    {
      id: 'services-setup',
      number: 2,
      title: 'Services Setup',
      description: 'Add your services, set pricing, and define duration. This helps clients book the right treatments.',
      icon: Scissors,
      status: state.servicesSetup
        ? 'completed'
        : state.salonProfile && !state.staffManagement && !state.businessHours && !state.goLive
        ? 'active'
        : !state.salonProfile
        ? 'locked'
        : 'pending',
      estimatedTime: '5 min',
      actionLabel: state.servicesSetup ? 'Completed' : state.salonProfile ? 'Configure' : 'Locked',
      onAction: () => {
        if (state.salonProfile && !state.servicesSetup) {
          window.location.href = '/owner/services'
        }
      },
    },
    {
      id: 'staff-management',
      number: 3,
      title: 'Staff Management',
      description: 'Add your stylists and team members, set their specialties, and configure availability.',
      icon: Users,
      status: state.staffManagement
        ? 'completed'
        : state.salonProfile && state.servicesSetup && !state.businessHours && !state.goLive
        ? 'active'
        : !state.salonProfile || !state.servicesSetup
        ? 'locked'
        : 'pending',
      estimatedTime: '7 min',
      actionLabel: state.staffManagement ? 'Completed' : state.servicesSetup ? 'Configure' : 'Locked',
      onAction: () => {
        if (state.servicesSetup && !state.staffManagement) {
          window.location.href = '/owner/staff'
        }
      },
    },
    {
      id: 'business-hours',
      number: 4,
      title: 'Business Hours',
      description: 'Configure your opening and closing times for each day of the week. This powers the booking system.',
      icon: Clock,
      status: state.businessHours
        ? 'completed'
        : state.salonProfile && state.servicesSetup && state.staffManagement && !state.goLive
        ? 'active'
        : !state.salonProfile || !state.servicesSetup || !state.staffManagement
        ? 'locked'
        : 'pending',
      estimatedTime: '4 min',
      actionLabel: state.businessHours ? 'Completed' : state.staffManagement ? 'Configure' : 'Locked',
      onAction: () => {
        if (state.staffManagement && !state.businessHours) {
          window.location.href = '/owner/settings'
        }
      },
    },
    {
      id: 'go-live',
      number: 5,
      title: 'Go Live',
      description: 'Test your booking flow and enable public access. Your salon will be visible to clients.',
      icon: Rocket,
      status: state.goLive
        ? 'completed'
        : state.salonProfile && state.servicesSetup && state.staffManagement && state.businessHours
        ? 'active'
        : 'locked',
      estimatedTime: '2 min',
      actionLabel: state.goLive ? 'Completed' : state.businessHours ? 'Go Live' : 'Locked',
      onAction: () => {
        if (state.businessHours && !state.goLive) {
          handleStepComplete('go-live')
        }
      },
    },
  ]

  if (isLoading) {
    return (
      <OwnerLayout title="Salon Setup" subtitle="Loading your onboarding progress...">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400" />
        </div>
      </OwnerLayout>
    )
  }

  return (
    <OwnerLayout
      title="Salon Setup"
      subtitle="Complete these steps to get your salon ready for the Beta Salon Program."
    >
      <AnimatePresence>
        {showCelebration && (
          <CelebrationAnimation onComplete={() => setShowCelebration(false)} />
        )}
      </AnimatePresence>

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 lg:gap-6 2xl:gap-8">
        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-[30px] border semantic.border.default bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.16),transparent_28%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.12),transparent_24%),rgba(10,14,26,0.92)] p-4 shadow-[0_30px_120px_rgba(0,0,0,0.35)] sm:p-5 xl:p-6">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.05),transparent_30%,transparent_70%,rgba(255,255,255,0.02))]" />
          <div className="relative">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-200">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Beta Salon Program</span>
                </div>
                <h2 className="mt-4 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                  {isComplete
                    ? 'Your salon is live!'
                    : 'Set up your salon in minutes'}
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-300 sm:text-base">
                  {isComplete
                    ? 'Congratulations! You\'ve completed all setup steps. Your salon is ready to accept bookings.'
                    : 'Follow these simple steps to configure your salon profile, add services, manage staff, and go live.'}
                </p>
              </div>

              {/* Progress Section */}
              <div className="lg:w-80 xl:w-96">
                <ProgressBar progress={progress} size="lg" />
                {isComplete && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 flex items-center gap-2 text-emerald-300"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-sm font-medium">All steps completed!</span>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Quick Stats */}
        <section className="rounded-[28px] border semantic.border.default bg-zinc-900/70 p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-sky-300" />
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
              Quick Stats
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <QuickStatCard
              icon={Scissors}
              label="Services"
              value={state.servicesCount || '—'}
              accent="text-emerald-300"
            />
            <QuickStatCard
              icon={Users}
              label="Staff Members"
              value={state.staffCount || '—'}
              accent="text-sky-300"
            />
            <QuickStatCard
              icon={Calendar}
              label="Next Available"
              value={state.nextAvailableSlot || '—'}
              accent="text-violet-300"
            />
          </div>
        </section>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-5 lg:gap-6">
          {/* Steps Section */}
          <OwnerModuleBoundary title="Onboarding Steps">
            <section className="rounded-[28px] border semantic.border.default bg-zinc-900/70 p-5 sm:p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
                    Setup Steps
                  </h3>
                  <p className="mt-1 text-sm text-zinc-400">
                    Complete all steps to activate your salon
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-white">
                    {steps.filter((s) => s.status === 'completed').length}
                  </span>
                  <span className="text-zinc-500"> / {steps.length}</span>
                </div>
              </div>

              <div className="space-y-4">
                {steps.map((step, index) => (
                  <OnboardingStep
                    key={step.id}
                    step={step}
                    isLast={index === steps.length - 1}
                  />
                ))}
              </div>

              {/* Complete Setup CTA */}
              {!isComplete && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-6 pt-6 border-t border-white/5"
                >
                  <button
                    onClick={() => {
                      const nextStep = steps.find((s) => s.status === 'active')
                      if (nextStep) {
                        nextStep.onAction()
                      }
                    }}
                    className="group w-full rounded-2xl bg-gradient-to-r from-emerald-400/20 to-sky-400/20 border border-emerald-400/30 p-4 text-center transition-all hover:from-emerald-400/30 hover:to-sky-400/30 hover:border-emerald-400/40"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-sm font-semibold text-emerald-200">
                        Continue Setup
                      </span>
                      <ArrowRight className="h-4 w-4 text-emerald-300 transition-transform group-hover:translate-x-1" />
                    </div>
                  </button>
                </motion.div>
              )}
            </section>
          </OwnerModuleBoundary>

          {/* Sidebar */}
          <div className="space-y-5">
            <OwnerModuleBoundary title="Quick Actions">
              <QuickActions
                onPreviewClientView={handlePreviewClientView}
                onTestBookingFlow={handleTestBookingFlow}
                onSendTestSMS={handleSendTestSMS}
                onViewAnalytics={handleViewAnalytics}
              />
            </OwnerModuleBoundary>

            {/* Help Card */}
            <div className="rounded-[28px] border semantic.border.default bg-zinc-900/70 p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <Store className="h-4 w-4 text-amber-300" />
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
                  Need Help?
                </h3>
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Our team is here to help you get set up. Reach out if you need assistance with any step.
              </p>
              <button className="mt-4 w-full rounded-xl border semantic.border.default glass.default px-4 py-2.5 text-sm font-medium text-zinc-300 transition-all hover:glass.strong hover:text-white">
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>
    </OwnerLayout>
  )
}
