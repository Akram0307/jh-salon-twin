import StaffManager from '../../features/staff/StaffManager'
import OwnerPageScaffold from './OwnerPageScaffold'
import OwnerPageSection from './OwnerPageSection'

export default function OwnerStaffPage() {
  return (
    <OwnerPageScaffold
      title="Staff Management"
      subtitle="Manage team members, capacity, and role readiness from the canonical owner route tree."
      nextSteps={[
        { label: 'Open services', to: '/owner/services' },
        { label: 'Open schedule', to: '/owner/schedule' },
      ]}
    >
      <OwnerPageSection
        eyebrow="Management"
        title="Team roster"
        description="Phase 0 reuses the existing staff module inside the new owner shell."
      >
        <StaffManager />
      </OwnerPageSection>
    </OwnerPageScaffold>
  )
}
