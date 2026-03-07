import OwnerLayout from '../../components/layout/OwnerLayout'
import DashboardHeader from '../../features/dashboard/components/DashboardHeader'
import RevenueChart from '../../features/dashboard/components/RevenueChart'
import ActivityFeed from '../../features/dashboard/components/ActivityFeed'
import ClientProfiles from '../../features/dashboard/components/ClientProfiles'
import AppointmentBoard from '../../features/dashboard/components/AppointmentBoard'
import StaffUtilizationHeatmap from '../../features/dashboard/components/StaffUtilizationHeatmap'
import WaitlistRecoveryMonitor from '../../features/dashboard/components/WaitlistRecoveryMonitor'
import AICampaignControlPanel from '../../features/dashboard/components/AICampaignControlPanel'
import RevenueOpportunityEnginePanel from '../../features/dashboard/components/RevenueOpportunityEnginePanel'
import RevenueForecast from '../../features/dashboard/components/RevenueForecast'
import StaffPerformancePanel from '../../features/dashboard/components/StaffPerformancePanel'
import POSIntelligencePanel from '../../features/dashboard/components/POSIntelligencePanel'
import SystemHealthPanel from '../../features/dashboard/components/SystemHealthPanel'
import QuickPOS from '../../features/pos/components/QuickPOS'
import KpiCard from '../../components/ui/KpiCard'
import { useOwnerDashboard } from '../../features/dashboard/hooks/useOwnerDashboard'

export default function OwnerDashboard() {
  const { data } = useOwnerDashboard()

  const revenue = data?.revenue_today ?? '--'
  const bookings = data?.bookings_today ?? '--'
  const clients = data?.new_clients ?? '--'
  const upcoming = data?.upcoming?.length ?? '--'

  return (
    <OwnerLayout
      title="Owner Control Tower"
      subtitle="Monitor revenue, operations, AI automation, and system health from a canonical owner dashboard shell."
    >
      <DashboardHeader />

      <div className="grid grid-cols-1 gap-4 mb-8 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Revenue Today" value={revenue} />
        <KpiCard title="Bookings Today" value={bookings} />
        <KpiCard title="New Clients" value={clients} />
        <KpiCard title="Upcoming Appointments" value={upcoming} />
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <RevenueChart />
        </div>
        <ActivityFeed />
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        <AppointmentBoard />
        <ClientProfiles />
        <QuickPOS />
        <StaffPerformancePanel />
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        <POSIntelligencePanel />
        <SystemHealthPanel />
      </div>

      <div className="rounded-3xl border border-white/10 bg-zinc-900/80 p-4 sm:p-5 lg:p-6">
        <h3 className="mb-4 text-lg font-semibold text-white">Revenue Intelligence</h3>

        <RevenueForecast />

        <div className="mt-6">
          <StaffUtilizationHeatmap />
        </div>

        <div className="mt-6">
          <RevenueOpportunityEnginePanel />
        </div>

        <div className="mt-6">
          <AICampaignControlPanel />
        </div>

        <div className="mt-6">
          <WaitlistRecoveryMonitor />
        </div>
      </div>
    </OwnerLayout>
  )
}
