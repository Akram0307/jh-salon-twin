import ClientList from '../../features/clients/ClientList'
import OwnerPageScaffold from './OwnerPageScaffold'
import OwnerPageSection from './OwnerPageSection'

export default function OwnerClientsPage() {
  return (
    <OwnerPageScaffold
      title="Client CRM"
      subtitle="Review client records, retention signals, and relationship context from a dedicated owner page."
      nextSteps={[
        { label: 'Open dashboard', to: '/owner/dashboard' },
        { label: 'Open reports', to: '/owner/reports' },
      ]}
    >
      <OwnerPageSection
        eyebrow="CRM"
        title="Client directory"
        description="Phase 0 moves the current client list into the owner shell and prepares the route for richer client intelligence modules."
      >
        <ClientList />
      </OwnerPageSection>
    </OwnerPageScaffold>
  )
}
