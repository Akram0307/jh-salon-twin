import FrontdeskLayout from './FrontdeskLayout'
import OwnerPageSection from '../owner/OwnerPageSection'
import AppointmentBoard from '../../features/dashboard/components/AppointmentBoard'

export default function FrontdeskQueuePage() {
  return (
    <FrontdeskLayout
      title="Live Queue"
      subtitle="Manage arrivals, in-progress appointments, and completion flow from a reception-first queue board."
    >
      <OwnerPageSection
        eyebrow="Queue ops"
        title="Appointments and check-ins"
        description="Use this live board to coordinate arrivals, waiting clients, and same-day service flow."
      >
        <AppointmentBoard />
      </OwnerPageSection>
    </FrontdeskLayout>
  )
}
