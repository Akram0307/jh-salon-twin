import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { FaChartLine, FaCalendarAlt, FaUsers, FaUserTie, FaCut, FaCog, FaBars } from 'react-icons/fa'

const items = [
  { path: '/', label: 'Dashboard', icon: FaChartLine },
  { path: '/schedule', label: 'Schedule', icon: FaCalendarAlt },
  { path: '/clients', label: 'Clients', icon: FaUsers },
  { path: '/staff', label: 'Staff', icon: FaUserTie },
  { path: '/services', label: 'Services', icon: FaCut },
  { path: '/reports', label: 'Reports', icon: FaChartLine },
  { path: '/settings', label: 'Settings', icon: FaCog }
]

export default function Sidebar(){
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside className={collapsed ? 'sidebar collapsed' : 'sidebar'}>
      <div className="logo-row">
        {!collapsed && <div className="logo">SalonOS</div>}
        <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)}>
          <FaBars />
        </button>
      </div>

      <nav>
        {items.map(i => {
          const Icon = i.icon
          const active = location.pathname === i.path

          return (
            <Link
              key={i.path}
              to={i.path}
              className={active ? 'nav-item active' : 'nav-item'}
            >
              <Icon className="nav-icon" />
              {!collapsed && <span>{i.label}</span>}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
