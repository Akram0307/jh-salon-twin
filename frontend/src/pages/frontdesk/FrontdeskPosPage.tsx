import FrontdeskLayout from './FrontdeskLayout'
import OwnerPageSection from '../owner/OwnerPageSection'
import QuickPOS from '../../features/pos/components/QuickPOS'

export default function FrontdeskPosPage() {
  return (
    <FrontdeskLayout
      title="Frontdesk POS"
      subtitle="Handle checkout, payment capture, and add-on service billing from a focused point-of-sale flow."
    >
      <OwnerPageSection
        eyebrow="Checkout"
        title="Fast payment surface"
        description="Optimized for rapid cashier actions with minimal context switching during peak reception traffic."
      >
        <QuickPOS />
      </OwnerPageSection>
    </FrontdeskLayout>
  )
}
