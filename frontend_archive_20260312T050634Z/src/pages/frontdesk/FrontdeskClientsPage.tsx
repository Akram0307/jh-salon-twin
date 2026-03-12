import FrontdeskLayout from './FrontdeskLayout'
import OwnerPageSection from '../owner/OwnerPageSection'
import ClientList from '../../features/clients/ClientList'

export default function FrontdeskClientsPage() {
  return (
    <FrontdeskLayout
      title="Client Desk"
      subtitle="Search clients, confirm details, and support rapid walk-in or phone booking workflows."
    >
      <OwnerPageSection
        eyebrow="Client ops"
        title="Client lookup and support"
        description="Frontdesk teams can use this directory as the first-touch surface for verification, service guidance, and follow-up."
      >
        <ClientList />
      </OwnerPageSection>
    </FrontdeskLayout>
  )
}
