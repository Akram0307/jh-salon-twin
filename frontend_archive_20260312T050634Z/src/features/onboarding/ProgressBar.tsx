import { motion } from 'framer-motion'
import { glass, semantic, component } from '../../lib/design-tokens';

interface ProgressBarProps {
  progress: number
  showPercentage?: boolean
  size?: 'sm' | 'md' | 'lg'
  animated?: boolean
}

export default function ProgressBar({
  progress,
  showPercentage = true,
  size = 'md',
  animated = true,
}: ProgressBarProps) {
  const clampedProgress = Math.min(Math.max(progress, 0), 100)

  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
          Setup Progress
        </span>
        {showPercentage && (
          <motion.span
            className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-300"
            initial={false}
            animate={{ opacity: 1 }}
            key={clampedProgress}
          >
            {Math.round(clampedProgress)}%
          </motion.span>
        )}
      </div>
      <div
        className={`w-full rounded-full glass.strong overflow-hidden ${sizeClasses[size]}`}
      >
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-emerald-300 to-sky-300"
          initial={{ width: 0 }}
          animate={{ width: `${clampedProgress}%` }}
          transition={
            animated
              ? {
                  duration: 0.8,
                  ease: [0.4, 0, 0.2, 1],
                }
              : { duration: 0 }
          }
        />
      </div>
    </div>
  )
}
