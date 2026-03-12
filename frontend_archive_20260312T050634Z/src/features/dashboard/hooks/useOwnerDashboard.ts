import { useQuery } from '@tanstack/react-query'
import { apiGet } from '../../../core/api/client'
import { fallbackDashboard } from '../../../core/types/api'

interface DashboardData {
  revenue_today: string | number
  bookings_today: number
  new_clients: number
  upcoming: { id: string; start_time: string }[]
  trends: { day: string; revenue: number }[]
  rebookable_clients: { id: string; name: string; risk: string }[]
}

async function fetchRevenueIntelligence(): Promise<DashboardData> {
  const res = await apiGet<{
    pos_metrics?: {
      revenue_today?: string | number
      bookings_today?: number
      new_clients?: number
    }
    revenue_trends?: { day: string; revenue: number }[]
    empty_slots?: { id: string; start_time: string }[]
    rebookable_clients?: { id: string; name: string; risk: string }[]
  }>('/api/revenue/intelligence')

  return {
    revenue_today: res?.pos_metrics?.revenue_today ?? fallbackDashboard.revenue_today,
    bookings_today: res?.pos_metrics?.bookings_today ?? fallbackDashboard.bookings_today,
    new_clients: res?.pos_metrics?.new_clients ?? fallbackDashboard.new_clients,
    upcoming: res?.empty_slots?.length ? res.empty_slots : fallbackDashboard.upcoming,
    trends: res?.revenue_trends?.length ? res.revenue_trends : fallbackDashboard.trends,
    rebookable_clients: res?.rebookable_clients?.length ? res.rebookable_clients : fallbackDashboard.rebookable_clients,
  }
}

export function useOwnerDashboard() {
  return useQuery<DashboardData>({
    queryKey: ['owner-dashboard'],
    queryFn: fetchRevenueIntelligence,
    staleTime: 5 * 60 * 1000, // 5 minutes
    initialData: fallbackDashboard,
  })
}
