import { Link, useLocation } from 'react-router-dom'
import { FaHome, FaCalendarAlt, FaUsers, FaChartLine, FaCog } from 'react-icons/fa'

const items = [
  { path: '/', label: 'Home', icon: FaHome },
  { path: '/schedule', label: 'Schedule', icon: FaCalendarAlt },
  { path: '/clients', label: 'Clients', icon: FaUsers },
  { path: '/reports', label: 'Reports', icon: FaChartLine },
  { path: '/settings', label: 'Settings', icon: FaCog }
]

export default function BottomNav(){
  const location = useLocation()

  return (
    <div className="bottom-nav">
      {items.map(i => {
        const Icon = i.icon
        const active = location.pathname === i.path

        return (
          <Link
            key={i.path}
            to={i.path}
            className={active ? 'bottom-item active' : 'bottom-item'}
          >
            <Icon />
            <span>{i.label}</span>
          </Link>
        )
      })}
    </div>
  )
}
