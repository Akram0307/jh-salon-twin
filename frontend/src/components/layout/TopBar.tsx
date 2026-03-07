import { FaBell, FaSearch, FaPlus } from 'react-icons/fa'

export default function TopBar(){
  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="page-title">Owner Control Tower</div>
      </div>

      <div className="topbar-center">
        <div className="search-box">
          <FaSearch />
          <input placeholder="Search clients, bookings, services..." />
        </div>
      </div>

      <div className="topbar-right">
        <button className="quick-action">
          <FaPlus /> New Booking
        </button>

        <button className="icon-btn">
          <FaBell />
        </button>

        <div className="avatar">O</div>
      </div>
    </header>
  )
}
