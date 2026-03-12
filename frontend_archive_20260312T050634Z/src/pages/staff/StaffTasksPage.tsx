import { CheckCircle2 } from 'lucide-react'
import StaffLayout from './StaffLayout'
import { RoleHero, RoleSection, RoleChipRow } from '../../components/ops/RoleSurface'
import { glass, semantic, component } from '../../lib/design-tokens';

const tasks = [
  'Prepare station for first appointment',
  "Review today's booked services and durations",
  'Confirm client consultation notes before service start',
  'Mark completed services and handoff for checkout',
]

export default function StaffTasksPage() {
  return (
    <StaffLayout
      title="Staff Tasks"
      subtitle="A polished checklist surface for shift readiness, service quality, and premium floor coordination."
    >
      <RoleHero
        eyebrow="Shift checklist"
        title="Operational tasks with a premium, low-friction staff experience."
        description="Instead of looking like a utility page, this task surface now feels like part of the same premium SalonOS operating system used by owners and frontdesk teams."
      >
        <RoleChipRow
          items={[
            { label: 'Mode', value: 'Execution' },
            { label: 'Priority', value: 'Readiness + handoff' },
            { label: 'Design', value: 'Owner-aligned premium shell' },
          ]}
        />
      </RoleHero>

      <RoleSection title="Operational tasks" description="A starter premium task panel ready for real-time orchestration later.">
        <div className="space-y-3">
          {tasks.map((task, index) => (
            <div key={task} className="flex items-start gap-3 rounded-[22px] border semantic.border.default bg-zinc-950/40 px-4 py-4 text-sm text-zinc-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-300 ring-1 ring-emerald-400/20">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">Task {index + 1}</div>
                <div className="mt-1 text-sm text-white">{task}</div>
              </div>
            </div>
          ))}
        </div>
      </RoleSection>
    </StaffLayout>
  )
}
