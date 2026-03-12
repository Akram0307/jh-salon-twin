import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrendingUp,
  Users,
  Calendar,
  DollarSign,
  Clock,
  AlertTriangle,
  ChevronRight,
  Zap,
  Bell,
  Settings,
  Search,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  X,
} from 'lucide-react'
import { glass, semantic, component } from '../../lib/design-tokens'
import OwnerLayout from '../../components/layout/OwnerLayout'

// Mock data hook
function useOwnerDashboard() {
  return {
    data: {
      kpis: {
        revenue: { value: '$12,847', change: '+12.3%', trend: 'up' as const },
        bookings: { value: '147', change: '+8.1%', trend: 'up' as const },
        clients: { value: '89', change: '+5.2%', trend: 'up' as const },
        utilization: { value: '78%', change: '-2.1%', trend: 'down' as const },
      },
      alerts: [
        { id: 1, type: 'warning' as const, message: 'Staff capacity at 85% for tomorrow', action: 'Review Schedule' },
        { id: 2, type: 'info' as const, message: '3 clients due for rebooking', action: 'Send Reminders' },
        { id: 3, type: 'success' as const, message: 'Weekly revenue target achieved', action: 'View Report' },
      ],
      recentBookings: [
        { id: 1, client: 'Sarah M.', service: 'Balayage', time: '10:00 AM', status: 'confirmed' },
        { id: 2, client: 'James K.', service: 'Haircut', time: '11:30 AM', status: 'in-progress' },
        { id: 3, client: 'Emily R.', service: 'Color', time: '2:00 PM', status: 'confirmed' },
        { id: 4, client: 'Michael T.', service: 'Beard Trim', time: '3:30 PM', status: 'pending' },
      ],
    },
  }
}

// KPI Card Component
function KpiCard({ title, value, change, trend, icon: Icon }: {
  title: string
  value: string
  change: string
  trend: 'up' | 'down'
  icon: typeof TrendingUp
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${component.card} p-5`}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
              <Icon className="h-4 w-4 text-emerald-400" />
            </div>
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">{title}</span>
          </div>
          <div className="mt-3 text-2xl font-semibold text-white">{value}</div>
        </div>
        <div className={`flex items-center gap-1 text-xs font-medium ${trend === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
          {trend === 'up' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          {change}
        </div>
      </div>
    </motion.div>
  )
}

// Alert Card Component
function AlertCard({ alert }: { alert: { id: number; type: 'warning' | 'info' | 'success'; message: string; action: string } }) {
  const colors = {
    warning: 'border-amber-500/20 bg-amber-500/5',
    info: 'border-blue-500/20 bg-blue-500/5',
    success: 'border-emerald-500/20 bg-emerald-500/5',
  }
  const iconColors = {
    warning: 'text-amber-400',
    info: 'text-blue-400',
    success: 'text-emerald-400',
  }

  return (
    <div className={`flex items-center justify-between rounded-xl border p-4 ${colors[alert.type]}`}>
      <div className="flex items-center gap-3">
        {alert.type === 'warning' && <AlertTriangle className={`h-4 w-4 ${iconColors[alert.type]}`} />}
        {alert.type === 'info' && <Bell className={`h-4 w-4 ${iconColors[alert.type]}`} />}
        {alert.type === 'success' && <Sparkles className={`h-4 w-4 ${iconColors[alert.type]}`} />}
        <span className="text-sm text-zinc-300">{alert.message}</span>
      </div>
      <button className="flex items-center gap-1 text-xs font-medium text-zinc-400 hover:text-white transition-colors">
        {alert.action}
        <ChevronRight className="h-3 w-3" />
      </button>
    </div>
  )
}

// Booking Row Component
function BookingRow({ booking }: { booking: { id: number; client: string; service: string; time: string; status: string } }) {
  const statusColors: Record<string, string> = {
    confirmed: 'bg-emerald-500/10 text-emerald-400',
    'in-progress': 'bg-blue-500/10 text-blue-400',
    pending: 'bg-amber-500/10 text-amber-400',
  }

  return (
    <div className="flex items-center justify-between py-3 border-b border-white/[0.04] last:border-0">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 text-sm font-medium text-zinc-300">
          {booking.client.charAt(0)}
        </div>
        <div>
          <div className="text-sm font-medium text-white">{booking.client}</div>
          <div className="text-xs text-zinc-500">{booking.service}</div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-zinc-400">{booking.time}</span>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[booking.status]}`}>
          {booking.status}
        </span>
      </div>
    </div>
  )
}

// Main Dashboard Component
export default function OwnerDashboard() {
  const { data } = useOwnerDashboard()
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  return (
    <OwnerLayout
      title="Revenue Command Center"
      subtitle="Real-time operational intelligence for your salon. Monitor KPIs, manage bookings, and drive growth."
    >
      {/* KPI Pulse Strip */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Today's Pulse</h3>
          <span className="text-xs text-zinc-500">
            {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard title="Revenue" value={data.kpis.revenue.value} change={data.kpis.revenue.change} trend={data.kpis.revenue.trend} icon={DollarSign} />
          <KpiCard title="Bookings" value={data.kpis.bookings.value} change={data.kpis.bookings.change} trend={data.kpis.bookings.trend} icon={Calendar} />
          <KpiCard title="Clients" value={data.kpis.clients.value} change={data.kpis.clients.change} trend={data.kpis.clients.trend} icon={Users} />
          <KpiCard title="Utilization" value={data.kpis.utilization.value} change={data.kpis.utilization.change} trend={data.kpis.utilization.trend} icon={Clock} />
        </div>
      </section>

      {/* Critical Action Alerts */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Action Required</h3>
          <span className="text-xs text-zinc-500">{data.alerts.length} items</span>
        </div>
        <div className="space-y-3">
          {data.alerts.map((alert) => (
            <AlertCard key={alert.id} alert={alert} />
          ))}
        </div>
      </section>

      {/* Operational Workspace */}
      <section>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Bookings */}
          <div className={`${component.card} p-5`}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Today's Schedule</h3>
              <button className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition-colors">
                View All
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
            <div>
              {data.recentBookings.map((booking) => (
                <BookingRow key={booking.id} booking={booking} />
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className={`${component.card} p-5`}>
            <h3 className="mb-4 text-sm font-semibold text-white">Quick Actions</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <button className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-left transition-all hover:bg-white/[0.04] hover:border-white/[0.1]">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                  <Calendar className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <div className="text-sm font-medium text-white">New Booking</div>
                  <div className="text-xs text-zinc-500">Schedule appointment</div>
                </div>
              </button>
              <button className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-left transition-all hover:bg-white/[0.04] hover:border-white/[0.1]">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                  <Users className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <div className="text-sm font-medium text-white">Add Client</div>
                  <div className="text-xs text-zinc-500">New client profile</div>
                </div>
              </button>
              <button className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-left transition-all hover:bg-white/[0.04] hover:border-white/[0.1]">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10">
                  <Zap className="h-5 w-5 text-violet-400" />
                </div>
                <div>
                  <div className="text-sm font-medium text-white">AI Insights</div>
                  <div className="text-xs text-zinc-500">Revenue optimization</div>
                </div>
              </button>
              <button className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-left transition-all hover:bg-white/[0.04] hover:border-white/[0.1]">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                  <TrendingUp className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <div className="text-sm font-medium text-white">Reports</div>
                  <div className="text-xs text-zinc-500">Analytics dashboard</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* AI Revenue Intelligence */}
      <section>
        <div className={`${component.card} p-5`}>
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
              <Sparkles className="h-4 w-4 text-violet-400" />
            </div>
            <h3 className="text-sm font-semibold text-white">AI Revenue Intelligence</h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-4">
              <div className="text-xs text-zinc-500">Rebooking Opportunity</div>
              <div className="mt-1 text-lg font-semibold text-white">12 clients</div>
              <div className="mt-1 text-xs text-emerald-400">Est. $2,400 revenue</div>
            </div>
            <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-4">
              <div className="text-xs text-zinc-500">Upsell Potential</div>
              <div className="mt-1 text-lg font-semibold text-white">8 bookings</div>
              <div className="mt-1 text-xs text-emerald-400">Est. $640 additional</div>
            </div>
            <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-4">
              <div className="text-xs text-zinc-500">Waitlist Recovery</div>
              <div className="mt-1 text-lg font-semibold text-white">3 slots</div>
              <div className="mt-1 text-xs text-amber-400">Action needed</div>
            </div>
          </div>
        </div>
      </section>
    </OwnerLayout>
  )
}
