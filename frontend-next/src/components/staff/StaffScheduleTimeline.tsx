/**
 * StaffScheduleTimeline Component
 * 
 * Displays a timeline of appointments for the current day for staff members.
 * Touch-optimized with minimum 48px touch targets.
 */

'use client';

import { useState } from 'react';
import { Appointment } from '@/types/appointment';
import { tokens } from '@/lib/design-tokens';
import { AppointmentDisplay } from '@/app/staff/schedule/page';



interface StaffScheduleTimelineProps {
  appointments: AppointmentDisplay[];
  onAppointmentClick?: (appointment: AppointmentDisplay) => void;
  isLoading?: boolean;
}

export default function StaffScheduleTimeline({ 
  appointments, 
  onAppointmentClick, 
  isLoading = false 
}: StaffScheduleTimelineProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // Group appointments by hour for timeline view
  const groupByHour = () => {
    const hours: { [key: number]: AppointmentDisplay[] } = {};
    
    appointments.forEach(appointment => {
      const hour = new Date(appointment.startTime).getHours();
      if (!hours[hour]) hours[hour] = [];
      hours[hour].push(appointment);
    });
    
    // Sort hours in ascending order
    return Object.keys(hours)
      .map(Number)
      .sort((a, b) => a - b)
      .map(hour => ({ hour, appointments: hours[hour] }));
  };
  
  // Format time for display
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };
  
  // Calculate duration in minutes
  const calculateDuration = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
  };
  
  // Toggle expanded state
  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };
  
  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        {[1, 2, 3].map((i) => (
          <div 
            key={i}
            className="h-24 rounded-xl animate-pulse"
            style={{ backgroundColor: 'oklch(0.95 0.01 75)' }}
          />
        ))}
      </div>
    );
  }
  
  if (appointments.length === 0) {
    return (
      <div 
        className="p-8 rounded-xl text-center"
        style={{ 
          backgroundColor: 'oklch(0.98 0.005 85)',
          border: '1px solid oklch(0.90 0.01 85)',
        }}
      >
        <div className="text-4xl mb-4">📅</div>
        <h3 
          className="font-semibold text-lg mb-2"
          style={{ color: 'oklch(0.20 0.01 264)' }}
        >
          No Appointments Today
        </h3>
        <p style={{ color: 'oklch(0.45 0.01 264)' }}>
          You have no scheduled appointments for today.
        </p>
      </div>
    );
  }
  
  const groupedAppointments = groupByHour();
  
  return (
    <div className="space-y-6 p-4">
      <h2 
        className="font-semibold text-xl mb-6"
        style={{ color: 'oklch(0.20 0.01 264)' }}
      >
        Today's Schedule
      </h2>
      
      <div className="space-y-8">
        {groupedAppointments.map(({ hour, appointments: hourAppointments }) => (
          <div key={hour} className="relative">
            {/* Hour marker */}
            <div 
              className="flex items-center mb-4"
            >
              <div 
                className="w-16 h-8 rounded-lg flex items-center justify-center font-medium"
                style={{
                  backgroundColor: 'oklch(0.96 0.02 75)', // Light champagne
                  color: 'oklch(0.20 0.01 264)',
                }}
              >
                {hour % 12 || 12}{hour < 12 ? 'AM' : 'PM'}
              </div>
              <div 
                className="flex-1 h-px ml-4"
                style={{ backgroundColor: 'oklch(0.90 0.01 85)' }}
              />
            </div>
            
            {/* Appointments for this hour */}
            <div className="space-y-3 ml-4">
              {hourAppointments.map((appointment) => (
                <div 
                  key={appointment.id}
                  className="rounded-xl overflow-hidden transition-all duration-200"
                  style={{
                    backgroundColor: expandedId === appointment.id 
                      ? 'oklch(0.96 0.02 75)' // Light champagne when expanded
                      : 'oklch(0.98 0.005 85)', // Warm ivory when collapsed
                    border: '1px solid oklch(0.90 0.01 85)',
                    minHeight: '48px', // Touch target minimum
                  }}
                >
                  {/* Appointment header - always visible */}
                  <div 
                    className="p-4 cursor-pointer"
                    onClick={() => toggleExpand(appointment.id)}
                    style={{ minHeight: '48px' }}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span 
                            className="font-semibold"
                            style={{ color: 'oklch(0.20 0.01 264)' }}
                          >
                            {appointment.clientName}
                          </span>
                          <span 
                            className="text-sm px-2 py-1 rounded-full"
                            style={{
                              backgroundColor: 'oklch(0.96 0.02 75)',
                              color: 'oklch(0.20 0.01 264)',
                            }}
                          >
                            {appointment.serviceName}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm">
                          <span style={{ color: 'oklch(0.45 0.01 264)' }}>
                            {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                          </span>
                          <span style={{ color: 'oklch(0.45 0.01 264)' }}>
                            {calculateDuration(appointment.startTime, appointment.endTime)} min
                          </span>
                        </div>
                      </div>
                      
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{
                          backgroundColor: expandedId === appointment.id 
                            ? 'oklch(0.78 0.10 75)' // Champagne when expanded
                            : 'oklch(0.96 0.02 75)', // Light champagne when collapsed
                          color: expandedId === appointment.id 
                            ? 'white' 
                            : 'oklch(0.20 0.01 264)',
                        }}
                      >
                        {expandedId === appointment.id ? '−' : '+'}
                      </div>
                    </div>
                  </div>
                  
                  {/* Expanded details - only visible when expanded */}
                  {expandedId === appointment.id && (
                    <div 
                      className="px-4 pb-4 pt-2 border-t"
                      style={{ borderColor: 'oklch(0.90 0.01 85)' }}
                    >
                      <div className="space-y-3">
                        {/* Client preferences */}
                        {appointment.clientPreferences && (
                          <div>
                            <h4 
                              className="text-sm font-medium mb-1"
                              style={{ color: 'oklch(0.45 0.01 264)' }}
                            >
                              Client Preferences
                            </h4>
                            <p 
                              className="text-sm"
                              style={{ color: 'oklch(0.20 0.01 264)' }}
                            >
                              {appointment.clientPreferences}
                            </p>
                          </div>
                        )}
                        
                        {/* Notes */}
                        {appointment.notes && (
                          <div>
                            <h4 
                              className="text-sm font-medium mb-1"
                              style={{ color: 'oklch(0.45 0.01 264)' }}
                            >
                              Notes
                            </h4>
                            <p 
                              className="text-sm"
                              style={{ color: 'oklch(0.20 0.01 264)' }}
                            >
                              {appointment.notes}
                            </p>
                          </div>
                        )}
                        
                        {/* Action buttons */}
                        <div className="flex space-x-3 pt-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onAppointmentClick?.(appointment);
                            }}
                            className="flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                            style={{
                              backgroundColor: 'oklch(0.78 0.10 75)', // Champagne
                              color: 'white',
                              minHeight: '48px', // Touch target minimum
                            }}
                          >
                            View Details
                          </button>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // Handle check-in action
                            }}
                            className="flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                            style={{
                              backgroundColor: 'oklch(0.96 0.02 75)', // Light champagne
                              color: 'oklch(0.20 0.01 264)',
                              border: '1px solid oklch(0.90 0.01 85)',
                              minHeight: '48px', // Touch target minimum
                            }}
                          >
                            Check In
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
