import { Navigate, Outlet } from 'react-router-dom'
import ErrorBoundary from '../../components/system/ErrorBoundary'

export default function FrontdeskPortal() {
  return (
    <ErrorBoundary>
      <Outlet />
    </ErrorBoundary>
  )
}

export function FrontdeskPortalIndexRedirect() {
  return <Navigate to="dashboard" replace />
}
