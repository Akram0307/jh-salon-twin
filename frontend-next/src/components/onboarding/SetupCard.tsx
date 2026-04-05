'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Check, ChevronRight, Building2, Scissors, Users, Clock, Settings } from 'lucide-react';
import { OnboardingStep } from '@/types/onboarding';
import Link from 'next/link';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Building2,
  Scissors,
  Users,
  Clock,
  Settings,
};

interface SetupCardProps {
  step: OnboardingStep;
  index: number;
  onComplete?: (stepId: string) => void;
}

export function SetupCard({ step, index, onComplete }: SetupCardProps) {
  const Icon = ICON_MAP[step.icon] || Building2;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className={cn(
        'glass-card p-4 transition-all duration-200',
        step.completed ? 'border-success/30 bg-success/5' : 'hover:border-primary/30'
      )}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
            step.completed
              ? 'bg-success/20 text-success'
              : 'bg-muted text-muted-foreground'
          )}
        >
          {step.completed ? (
            <Check className="h-5 w-5" />
          ) : (
            <Icon className="h-5 w-5" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">{step.title}</h3>
            {step.required && !step.completed && (
              <span className="rounded-full bg-warning/10 px-2 py-0.5 text-[10px] font-medium text-warning">
                Required
              </span>
            )}
            {step.completed && (
              <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">
                Complete
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
            {step.description}
          </p>
        </div>

        {/* Action */}
        <div className="shrink-0">
          {step.completed ? (
            <button
              onClick={() => onComplete?.(step.id)}
              className="rounded-lg p-2 text-muted-foreground hover:bg-muted transition-colors focus-ring"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : step.route ? (
            <Link
              href={step.route}
              className="flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors focus-ring"
            >
              {step.actionLabel}
              <ChevronRight className="h-3 w-3" />
            </Link>
          ) : (
            <button
              onClick={() => onComplete?.(step.id)}
              className="flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors focus-ring"
            >
              {step.actionLabel}
              <ChevronRight className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
