import { Suspense, lazy } from 'react'
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

// Lazy load Owner portal pages
const OwnerPortal = lazy(() => import('./pages/owner/OwnerPortal'))
const OwnerDashboard = lazy(() => import('./pages/owner/OwnerDashboard'))
const OwnerStaffPage = lazy(() => import('./pages/owner/OwnerStaffPage'))
const OwnerServicesPage = lazy(() => import('./pages/owner/OwnerServicesPage'))
const OwnerSchedulePage = lazy(() => import('./pages/owner/OwnerSchedulePage'))
const OwnerClientsPage = lazy(() => import('./pages/owner/OwnerClientsPage'))
const OwnerReportsPage = lazy(() => import('./pages/owner/OwnerReportsPage'))
const OwnerSettingsPage = lazy(() => import('./pages/owner/OwnerSettingsPage'))

// Lazy load Onboarding page
const OnboardingDashboard = lazy(() => import('./features/onboarding/OnboardingDashboard'))

// Lazy load Client booking flow pages
const ClientChat = lazy(() => import('./pages/client/ClientChat'))
const ServiceSelect = lazy(() => import('./pages/client/ServiceSelect'))
const SlotSelect = lazy(() => import('./pages/client/SlotSelect'))
const BookingConfirm = lazy(() => import('./pages/client/BookingConfirm'))

// Lazy load Frontdesk portal pages
const FrontdeskPortal = lazy(() => import('./pages/frontdesk/FrontdeskPortal'))
const FrontdeskDashboard = lazy(() => import('./pages/frontdesk/FrontdeskDashboard'))
const FrontdeskQueuePage = lazy(() => import('./pages/frontdesk/FrontdeskQueuePage'))
const FrontdeskClientsPage = lazy(() => import('./pages/frontdesk/FrontdeskClientsPage'))
const FrontdeskPosPage = lazy(() => import('./pages/frontdesk/FrontdeskPosPage'))

// Lazy load Staff portal pages
const StaffPortal = lazy(() => import('./pages/staff/StaffPortal'))
const StaffTodayPage = lazy(() => import('./pages/staff/StaffTodayPage'))
const StaffSchedulePage = lazy(() => import('./pages/staff/StaffSchedulePage'))
const StaffClientsPage = lazy(() => import('./pages/staff/StaffClientsPage'))
const StaffTasksPage = lazy(() => import('./pages/staff/StaffTasksPage'))

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
  </div>
)

// Wrapper for lazy-loaded routes with Suspense
const LazyRoute = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<PageLoader />}>{children}</Suspense>
)

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/owner/dashboard" replace />} />

          {/* Onboarding Route */}
          <Route path="/onboarding" element={<LazyRoute><OnboardingDashboard /></LazyRoute>} />

          <Route path="/owner" element={<LazyRoute><OwnerPortal /></LazyRoute>}>
            <Route index element={<Navigate to="/owner/dashboard" replace />} />
            <Route path="dashboard" element={<LazyRoute><OwnerDashboard /></LazyRoute>} />
            <Route path="staff" element={<LazyRoute><OwnerStaffPage /></LazyRoute>} />
            <Route path="services" element={<LazyRoute><OwnerServicesPage /></LazyRoute>} />
            <Route path="schedule" element={<LazyRoute><OwnerSchedulePage /></LazyRoute>} />
            <Route path="clients" element={<LazyRoute><OwnerClientsPage /></LazyRoute>} />
            <Route path="reports" element={<LazyRoute><OwnerReportsPage /></LazyRoute>} />
            <Route path="settings" element={<LazyRoute><OwnerSettingsPage /></LazyRoute>} />
          </Route>

          <Route path="/frontdesk" element={<LazyRoute><FrontdeskPortal /></LazyRoute>}>
            <Route index element={<Navigate to="/frontdesk/dashboard" replace />} />
            <Route path="dashboard" element={<LazyRoute><FrontdeskDashboard /></LazyRoute>} />
            <Route path="queue" element={<LazyRoute><FrontdeskQueuePage /></LazyRoute>} />
            <Route path="clients" element={<LazyRoute><FrontdeskClientsPage /></LazyRoute>} />
            <Route path="pos" element={<LazyRoute><FrontdeskPosPage /></LazyRoute>} />
          </Route>

          <Route path="/staff" element={<LazyRoute><StaffPortal /></LazyRoute>}>
            <Route index element={<Navigate to="/staff/today" replace />} />
            <Route path="today" element={<LazyRoute><StaffTodayPage /></LazyRoute>} />
            <Route path="schedule" element={<LazyRoute><StaffSchedulePage /></LazyRoute>} />
            <Route path="clients" element={<LazyRoute><StaffClientsPage /></LazyRoute>} />
            <Route path="tasks" element={<LazyRoute><StaffTasksPage /></LazyRoute>} />
          </Route>

          {/* Client Booking Flow */}
          <Route path="/client" element={<LazyRoute><ClientChat /></LazyRoute>} />
          <Route path="/client/services" element={<LazyRoute><ServiceSelect /></LazyRoute>} />
          <Route path="/client/slots" element={<LazyRoute><SlotSelect /></LazyRoute>} />
          <Route path="/client/confirm" element={<LazyRoute><BookingConfirm /></LazyRoute>} />

          <Route path="/services" element={<Navigate to="/owner/services" replace />} />
          <Route path="/schedule" element={<Navigate to="/owner/schedule" replace />} />
          <Route path="/clients" element={<Navigate to="/owner/clients" replace />} />
          <Route path="/reports" element={<Navigate to="/owner/reports" replace />} />
          <Route path="/settings" element={<Navigate to="/owner/settings" replace />} />

          <Route path="*" element={<Navigate to="/owner/dashboard" replace />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  )
}
