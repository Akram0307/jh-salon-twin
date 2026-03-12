import ScheduleManager from '../../features/schedule/ScheduleManager'
import OwnerPageScaffold from './OwnerPageScaffold'
import OwnerPageSection from './OwnerPageSection'

export default function OwnerSchedulePage() {
  return (
    <OwnerPageScaffold
      title="Schedule Operations"
      subtitle="Centralize staff schedules, availability rules, and operating constraints for owner workflows."
      nextSteps={[
        { label: 'View clients', to: '/owner/clients' },
        { label: 'Open settings', to: '/owner/settings' },
      ]}
    >
      <OwnerPageSection
        eyebrow="Operations"
        title="Schedule manager"
        description="This route is the Phase 0 anchor for future schedule rules, blackout dates, and location-level availability controls."
      >
        <ScheduleManager />
      </OwnerPageSection>
    </OwnerPageScaffold>
  )
}
