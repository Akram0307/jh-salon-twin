/**
 * Staff Schedule Page
 * 
 * Displays the staff member's daily schedule timeline.
 * Part of the Staff Workspace PWA.
 */

'use client';

import { useState, useEffect } from 'react';
import StaffScheduleTimeline from '@/components/staff/StaffScheduleTimeline';
import { StaffAppointment } from '@/types/appointment';

// Mock data for development - FIXED with all required properties
const mockAppointments: StaffAppointment[] = [
  {
    id: '1',
    clientId: 'client-001',
    staffId: 'staff-001',
    serviceId: 'service-001',
    clientName: 'Sarah Johnson',
    serviceName: 'Women\'s Haircut',
    startTime: new Date().setHours(9, 0, 0, 0).toString(),
    endTime: new Date().setHours(9, 45, 0, 0).toString(),
    clientPreferences: 'Prefers shorter layers, sensitive scalp',
    notes: 'Regular client, likes to chat about travel',
    status: 'confirmed',
    price: 65,
    total: 65,
    paymentStatus: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    durationMinutes: 45,
    isUpcoming: true,
    isCurrent: false,
  },
  {
    id: '2',
    clientId: 'client-002',
    staffId: 'staff-001',
    serviceId: 'service-002',
    clientName: 'Emily Chen',
    serviceName: 'Balayage Highlights',
    startTime: new Date().setHours(10, 0, 0, 0).toString(),
    endTime: new Date().setHours(12, 0, 0, 0).toString(),
    clientPreferences: 'Natural-looking highlights, low maintenance',
    notes: 'Allergic to ammonia-based products',
    status: 'confirmed',
    price: 250,
    total: 250,
    paymentStatus: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    durationMinutes: 120,
    isUpcoming: true,
    isCurrent: false,
  },
  {
    id: '3',
    clientId: 'client-003',
    staffId: 'staff-001',
    serviceId: 'service-003',
    clientName: 'Michael Brown',
    serviceName: 'Men\'s Haircut + Beard Trim',
    startTime: new Date().setHours(12, 30, 0, 0).toString(),
    endTime: new Date().setHours(13, 15, 0, 0).toString(),
    clientPreferences: 'Classic side part, fade on sides',
    notes: '',
    status: 'confirmed',
    price: 45,
    total: 45,
    paymentStatus: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    durationMinutes: 45,
    isUpcoming: true,
    isCurrent: false,
  },
  {
    id: '4',
    clientId: 'client-004',
    staffId: 'staff-001',
    serviceId: 'service-004',
    clientName: 'Jessica Williams',
    serviceName: 'Keratin Treatment',
    startTime: new Date().setHours(14, 0, 0, 0).toString(),
    endTime: new Date().setHours(16, 30, 0, 0).toString(),
    clientPreferences: 'Curly hair, wants frizz control',
    notes: 'First time getting keratin, explain process',
    status: 'confirmed',
    price: 300,
    total: 300,
    paymentStatus: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    durationMinutes: 150,
    isUpcoming: true,
    isCurrent: false,
  },
  {
    id: '5',
    clientId: 'client-005',
    staffId: 'staff-001',
    serviceId: 'service-005',
    clientName: 'David Lee',
    serviceName: 'Hair Color + Style',
    startTime: new Date().setHours(17, 0, 0, 0).toString(),
    endTime: new Date().setHours(18, 30, 0, 0).toString(),
    clientPreferences: 'Covering gray, warm chestnut tone',
    notes: 'Prefers appointment at end of day',
    status: 'confirmed',
    price: 180,
    total: 180,
    paymentStatus: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    durationMinutes: 90,
    isUpcoming: true,
    isCurrent: false,
  },
];


export default function StaffSchedulePage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    // Simulate API call
    const fetchAppointments = async () => {
      setIsLoading(true);
      // In production, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 500));
      setAppointments(mockAppointments);
      setIsLoading(false);
    };

    fetchAppointments();
  }, [selectedDate]);

  const handleAppointmentClick = (appointment: Appointment) => {
    // Navigate to appointment detail or open modal
    console.log('Appointment clicked:', appointment);
  };

  // Format date for header
  const formatDateHeader = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      });
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'oklch(0.98 0.005 85)' }}>
      {/* Header */}
      <div 
        className="sticky top-0 z-10 px-4 py-4"
        style={{ 
          backgroundColor: 'oklch(0.98 0.005 85)',
          borderBottom: '1px solid oklch(0.90 0.01 85)',
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 
              className="text-2xl font-semibold"
              style={{ color: 'oklch(0.20 0.01 264)' }}
            >
              {formatDateHeader(selectedDate)}
            </h1>
            <p 
              className="text-sm mt-1"
              style={{ color: 'oklch(0.45 0.01 264)' }}
            >
              {appointments.length} appointments scheduled
            </p>
          </div>
          
          {/* Date navigation */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                const prev = new Date(selectedDate);
                prev.setDate(prev.getDate() - 1);
                setSelectedDate(prev);
              }}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
              style={{
                backgroundColor: 'oklch(0.96 0.02 75)',
                color: 'oklch(0.20 0.01 264)',
              }}
            >
              ←
            </button>
            <button
              onClick={() => setSelectedDate(new Date())}
              className="px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95"
              style={{
                backgroundColor: 'oklch(0.78 0.10 75)',
                color: 'white',
              }}
            >
              Today
            </button>
            <button
              onClick={() => {
                const next = new Date(selectedDate);
                next.setDate(next.getDate() + 1);
                setSelectedDate(next);
              }}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
              style={{
                backgroundColor: 'oklch(0.96 0.02 75)',
                color: 'oklch(0.20 0.01 264)',
              }}
            >
              →
            </button>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <StaffScheduleTimeline
        appointments={appointments}
        onAppointmentClick={handleAppointmentClick}
        isLoading={isLoading}
      />
    </div>
  );
}
