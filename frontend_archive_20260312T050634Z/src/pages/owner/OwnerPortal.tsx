import { Navigate, Outlet } from 'react-router-dom'
import ErrorBoundary from '../../components/system/ErrorBoundary'

export default function OwnerPortal() {
  return (
    <ErrorBoundary>
      <Outlet />
    </ErrorBoundary>
  )
}

export function OwnerPortalIndexRedirect() {
  return <Navigate to="dashboard" replace />
}
