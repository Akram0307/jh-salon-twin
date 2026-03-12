import { Link } from 'react-router-dom';
import { Scissors, Users, Settings } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-3xl w-full text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Jawed Habib Kurnool</h1>
        <p className="text-xl text-gray-600">Select your portal to continue</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
        {/* Client Portal */}
        <Link to="/client" className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all hover:-translate-y-1 p-8 flex flex-col items-center text-center border border-gray-100">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6">
            <Scissors size={32} />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">Client Booking</h2>
          <p className="text-gray-500">Book appointments with our AI Digital Receptionist.</p>
        </Link>

        {/* Staff Portal */}
        <Link to="/staff" className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all hover:-translate-y-1 p-8 flex flex-col items-center text-center border border-gray-100">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
            <Users size={32} />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">Staff Dashboard</h2>
          <p className="text-gray-500">Manage your appointments and daily schedule.</p>
        </Link>

        {/* Owner Portal */}
        <Link to="/owner" className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all hover:-translate-y-1 p-8 flex flex-col items-center text-center border border-gray-100">
          <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mb-6">
            <Settings size={32} />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">Owner Portal</h2>
          <p className="text-gray-500">Configure AI rules, manage staff, and view analytics.</p>
        </Link>
      </div>
    </div>
  );
}
