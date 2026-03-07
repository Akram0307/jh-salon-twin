import ReportsDashboard from '../../features/analytics/ReportsDashboard'
import OwnerPageScaffold from './OwnerPageScaffold'
import OwnerPageSection from './OwnerPageSection'

export default function OwnerReportsPage() {
  return (
    <OwnerPageScaffold
      title="Reports & Analytics"
      subtitle="Surface business intelligence, revenue reporting, and operational performance from the standardized owner route tree."
      nextSteps={[
        { label: 'Open dashboard', to: '/owner/dashboard' },
        { label: 'Open settings', to: '/owner/settings' },
      ]}
    >
      <OwnerPageSection
        eyebrow="Intelligence"
        title="Reporting module"
        description="The current analytics view is preserved here while Phase 1 evolves it into a deeper intelligence workspace."
      >
        <ReportsDashboard />
      </OwnerPageSection>
    </OwnerPageScaffold>
  )
}
