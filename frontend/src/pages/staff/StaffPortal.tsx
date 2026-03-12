import { Navigate, Outlet } from 'react-router-dom'
import ErrorBoundary from '../../components/system/ErrorBoundary'

export default function StaffPortal() {
  return (
    <ErrorBoundary>
      <Outlet />
    </ErrorBoundary>
  )
}

export function StaffPortalIndexRedirect() {
  return <Navigate to="today" replace />
}
