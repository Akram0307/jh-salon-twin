import ServicesManager from '../../features/services/ServicesManager'
import OwnerPageScaffold from './OwnerPageScaffold'
import OwnerPageSection from './OwnerPageSection'

export default function OwnerServicesPage() {
  return (
    <OwnerPageScaffold
      title="Service Catalog"
      subtitle="Control pricing, duration, and merchandising from a dedicated owner management route."
      nextSteps={[
        { label: 'Open staff', to: '/owner/staff' },
        { label: 'Open reports', to: '/owner/reports' },
      ]}
    >
      <OwnerPageSection
        eyebrow="Catalog"
        title="Services"
        description="Phase 0 preserves the existing services module while moving it into the canonical owner route family."
      >
        <ServicesManager />
      </OwnerPageSection>
    </OwnerPageScaffold>
  )
}
