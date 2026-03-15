import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom'

import OwnerPortal, { OwnerPortalIndexRedirect } from './pages/owner/OwnerPortal'
import OwnerDashboard from './pages/owner/OwnerDashboard'
import OwnerStaffPage from './pages/owner/OwnerStaffPage'
import OwnerServicesPage from './pages/owner/OwnerServicesPage'
import OwnerSchedulePage from './pages/owner/OwnerSchedulePage'
import OwnerClientsPage from './pages/owner/OwnerClientsPage'
import OwnerReportsPage from './pages/owner/OwnerReportsPage'
import OwnerSettingsPage from './pages/owner/OwnerSettingsPage'
import ClientChat from './pages/client/ClientChat'
import ClientApp from './ClientApp'

// Check if this is a Client PWA deployment
const isClientPWA = import.meta.env.VITE_APP_TYPE === 'client'

export default function App() {
  // If this is a Client PWA deployment, render only client routes
  if (isClientPWA) {
    return <ClientApp />
  }

  // Default: Owner PWA with full routing
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/owner/dashboard" replace />} />

        <Route path="/owner" element={<OwnerPortal />}>
          <Route index element={<OwnerPortalIndexRedirect />} />
          <Route path="dashboard" element={<OwnerDashboard />} />
          <Route path="staff" element={<OwnerStaffPage />} />
          <Route path="services" element={<OwnerServicesPage />} />
          <Route path="schedule" element={<OwnerSchedulePage />} />
          <Route path="clients" element={<OwnerClientsPage />} />
          <Route path="reports" element={<OwnerReportsPage />} />
          <Route path="settings" element={<OwnerSettingsPage />} />
        </Route>

        <Route path="/client" element={<ClientChat />} />

        <Route path="/staff" element={<Navigate to="/owner/staff" replace />} />
        <Route path="/services" element={<Navigate to="/owner/services" replace />} />
        <Route path="/schedule" element={<Navigate to="/owner/schedule" replace />} />
        <Route path="/clients" element={<Navigate to="/owner/clients" replace />} />
        <Route path="/reports" element={<Navigate to="/owner/reports" replace />} />
        <Route path="/settings" element={<Navigate to="/owner/settings" replace />} />
        <Route path="*" element={<Navigate to="/owner/dashboard" replace />} />
      </Routes>
    </Router>
  )
}
