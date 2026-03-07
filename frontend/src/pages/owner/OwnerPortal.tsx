import { Navigate, Outlet } from 'react-router-dom'

export default function OwnerPortal() {
  return <Outlet />
}

export function OwnerPortalIndexRedirect() {
  return <Navigate to="dashboard" replace />
}
