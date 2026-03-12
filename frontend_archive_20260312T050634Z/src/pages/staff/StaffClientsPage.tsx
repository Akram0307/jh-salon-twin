import StaffLayout from './StaffLayout'
import OwnerPageSection from '../owner/OwnerPageSection'
import ClientList from '../../features/clients/ClientList'

export default function StaffClientsPage() {
  return (
    <StaffLayout
      title="Client Profiles"
      subtitle="Quick access to client context before, during, and after service delivery."
    >
      <OwnerPageSection
        eyebrow="Client context"
        title="Today's clients"
        description="A lightweight staff-facing client directory for lookup and service preparation workflows."
      >
        <ClientList />
      </OwnerPageSection>
    </StaffLayout>
  )
}
