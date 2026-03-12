export const CLIENT_SALON_ID = import.meta.env.VITE_CLIENT_SALON_ID || 'b0dcbd9e-1ca0-450e-a299-7ad239f848f4'
export const WALKIN_CLIENT_NAME = 'Walk-in Client'
export const WALKIN_CLIENT_PHONE = '+910000000000'

export function getTodayDate() {
  return new Date().toISOString().split('T')[0]
}

export function resolveClientSalonId(input?: string | null) {
  return (input || CLIENT_SALON_ID).trim()
}
