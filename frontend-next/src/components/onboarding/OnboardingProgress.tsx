'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Check, Circle, Rocket } from 'lucide-react';
import { OnboardingStep } from '@/types/onboarding';

interface OnboardingProgressProps {
  steps: OnboardingStep[];
  progress: number;
  salonName: string | null;
  isReadyToLaunch: boolean;
  onLaunch?: () => void;
}

export function OnboardingProgress({
  steps,
  progress,
  salonName,
  isReadyToLaunch,
  onLaunch,
}: OnboardingProgressProps) {
  const completedCount = steps.filter((s) => s.completed).length;
  const totalCount = steps.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-4 mb-6"
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            {salonName ? `Setting up ${salonName}` : 'Welcome to SalonOS'}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {completedCount} of {totalCount} steps completed
          </p>
        </div>
        {isReadyToLaunch && onLaunch && (
          <button
            onClick={onLaunch}
            className="flex items-center gap-2 rounded-lg bg-success px-4 py-2 text-sm font-medium text-success-foreground hover:bg-success/90 transition-colors focus-ring"
          >
            <Rocket className="h-4 w-4" />
            Go Live
          </button>
        )}
      </div>

      {/* Progress bar */}
      <div className="relative h-2 rounded-full bg-muted overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary to-success"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      {/* Step indicators */}
      <div className="flex items-center justify-between mt-3">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={cn(
              'flex flex-col items-center gap-1',
              index < steps.length - 1 && 'flex-1'
            )}
          >
            <div
              className={cn(
                'flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors',
                step.completed
                  ? 'border-success bg-success text-success-foreground'
                  : 'border-muted-foreground/30 bg-background text-muted-foreground'
              )}
            >
              {step.completed ? (
                <Check className="h-3 w-3" />
              ) : (
                <Circle className="h-3 w-3" />
              )}
            </div>
            <span className="text-[10px] text-muted-foreground hidden sm:block">
              {step.title.split(' ')[0]}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
