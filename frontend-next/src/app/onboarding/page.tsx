'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { OnboardingProgress } from '@/components/onboarding/OnboardingProgress';
import { DEFAULT_ONBOARDING_STEPS, ONBOARDING_STORAGE_KEY, type OnboardingState, type OnboardingStep } from '@/types/onboarding';
import { Icons } from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Building2,
  Scissors,
  Users,
  Clock,
  Settings,
  Check,
  ArrowRight,
  Rocket,
} from 'lucide-react';

const stepIconMap: Record<string, React.ElementType> = {
  Building2,
  Scissors,
  Users,
  Clock,
  Settings,
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

export default function OnboardingPage() {
  const [steps, setSteps] = useState<OnboardingStep[]>(DEFAULT_ONBOARDING_STEPS);
  const [salonName, setSalonName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(ONBOARDING_STORAGE_KEY);
      if (saved) {
        const state: OnboardingState = JSON.parse(saved);
        if (state.steps?.length) setSteps(state.steps);
        if (state.salonName) setSalonName(state.salonName);
      }
    } catch {
      // Use defaults if parsing fails
    } finally {
      setIsLoading(false);
    }
  }, []);

  const completedCount = steps.filter((s) => s.completed).length;
  const totalCount = steps.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isReadyToLaunch = steps.filter((s) => s.required).every((s) => s.completed);
  const requiredIncomplete = steps.filter((s) => s.required && !s.completed);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

      <motion.div
        className="relative flex flex-1 flex-col items-center px-4 py-8 sm:py-12"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="text-center mb-6 w-full max-w-2xl" variants={itemVariants}>
          <div className="flex justify-center mb-3">
            <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Icons.logo className="h-6 w-6 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            {salonName ? `Setting up ${salonName}` : 'Welcome to SalonOS'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Complete these steps to get your salon up and running
          </p>
        </motion.div>

        <motion.div className="w-full max-w-2xl mb-6" variants={itemVariants}>
          <OnboardingProgress
            steps={steps}
            progress={progress}
            salonName={salonName}
            isReadyToLaunch={isReadyToLaunch}
            onLaunch={() => {
              window.location.href = '/owner/dashboard';
            }}
          />
        </motion.div>

        <div className="w-full max-w-2xl space-y-3">
          {steps.map((step) => {
            const IconComponent = stepIconMap[step.icon] || Settings;
            return (
              <motion.div key={step.id} variants={itemVariants}>
                <Link
                  href={step.route || '/owner/settings'}
                  className={cn(
                    'group flex items-center gap-4 rounded-xl border p-4 transition-all duration-200',
                    step.completed
                      ? 'border-success/30 bg-success/5 hover:border-success/50'
                      : step.required
                        ? 'border-border bg-card hover:border-primary/50'
                        : 'border-border/50 bg-card/50 hover:border-border'
                  )}
                >
                  <div className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border',
                    step.completed
                      ? 'bg-success/10 border-success/30 text-success'
                      : 'bg-muted/50 border-border/50 text-muted-foreground'
                  )}>
                    {step.completed ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <IconComponent className="h-5 w-5" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className={cn(
                        'text-sm font-semibold',
                        step.completed ? 'text-success' : 'text-foreground'
                      )}>
                        {step.title}
                      </h3>
                      {step.required && !step.completed && (
                        <span className="rounded-full bg-destructive/10 px-1.5 py-0.5 text-[10px] font-medium text-destructive border border-destructive/20">
                          Required
                        </span>
                      )}
                      {step.completed && (
                        <span className="rounded-full bg-success/10 px-1.5 py-0.5 text-[10px] font-medium text-success border border-success/20">
                          Done
                        </span>
                      )}
                      {!step.required && !step.completed && (
                        <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground border border-border/50">
                          Optional
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground truncate">
                      {step.description}
                    </p>
                  </div>

                  <ArrowRight className={cn(
                    'h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1',
                    step.completed ? 'text-success/50' : 'text-muted-foreground/40'
                  )} />
                </Link>
              </motion.div>
            );
          })}
        </div>

        <motion.div className="w-full max-w-2xl mt-6" variants={itemVariants}>
          {isReadyToLaunch ? (
            <div className="rounded-xl border border-success/30 bg-success/5 p-4 text-center">
              <Rocket className="h-6 w-6 text-success mx-auto mb-2" />
              <p className="text-sm font-medium text-success">All required steps complete!</p>
              <p className="text-xs text-muted-foreground mt-1">
                Your salon is ready to go live. Head to the dashboard to start managing appointments.
              </p>
              <Link href="/owner/dashboard">
                <Button className="mt-3 bg-success hover:bg-success/90 text-success-foreground">
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          ) : (
            <div className="rounded-xl border border-warning/20 bg-warning/5 p-4 text-center">
              <p className="text-sm font-medium text-warning">
                {requiredIncomplete.length} required step{requiredIncomplete.length > 1 ? 's' : ''} remaining
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Complete all required steps to activate your salon
              </p>
            </div>
          )}
        </motion.div>

        <motion.div className="mt-6" variants={itemVariants}>
          <Link
            href="/owner/dashboard"
            className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
          >
            Skip onboarding →
          </Link>
        </motion.div>
      </motion.div>

      <footer className="relative text-center pb-4 text-xs text-muted-foreground/50">
        © {new Date().getFullYear()} SalonOS · AI-native revenue operating system
      </footer>
    </div>
  );
}
