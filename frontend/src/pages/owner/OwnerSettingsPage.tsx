import SettingsPage from '../../features/settings/SettingsPage'
import OwnerPageScaffold from './OwnerPageScaffold'
import OwnerPageSection from './OwnerPageSection'

export default function OwnerSettingsPage() {
  return (
    <OwnerPageScaffold
      title="Settings"
      subtitle="Configure salon identity, business preferences, and future tenant-level controls from the owner settings shell."
      nextSteps={[
        { label: 'Open schedule', to: '/owner/schedule' },
        { label: 'Open staff', to: '/owner/staff' },
      ]}
    >
      <OwnerPageSection
        eyebrow="Configuration"
        title="Salon settings"
        description="Phase 0 gives settings a canonical owner route and reusable page scaffold without changing the existing feature module."
      >
        <SettingsPage />
      </OwnerPageSection>
    </OwnerPageScaffold>
  )
}
