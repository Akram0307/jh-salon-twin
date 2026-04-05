/**
 * WeeklyAvailabilityCalendar Component
 * 
 * Displays a weekly calendar view for staff availability.
 * Allows toggling available/unavailable for time slots.
 * Touch-optimized with minimum 48px touch targets.
 */

'use client';

import { useState } from 'react';
import { tokens } from '@/lib/design-tokens';

interface TimeSlot {
  id: string;
  day: number; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  isAvailable: boolean;
}

interface WeeklyAvailabilityCalendarProps {
  initialSlots?: TimeSlot[];
  onSlotToggle?: (slotId: string, isAvailable: boolean) => void;
  isLoading?: boolean;
}

export default function WeeklyAvailabilityCalendar({ 
  initialSlots = [], 
  onSlotToggle, 
  isLoading = false 
}: WeeklyAvailabilityCalendarProps) {
  const [slots, setSlots] = useState<TimeSlot[]>(initialSlots);
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay());
  
  // Days of the week
  const days = [
    { id: 0, name: 'Sun', fullName: 'Sunday' },
    { id: 1, name: 'Mon', fullName: 'Monday' },
    { id: 2, name: 'Tue', fullName: 'Tuesday' },
    { id: 3, name: 'Wed', fullName: 'Wednesday' },
    { id: 4, name: 'Thu', fullName: 'Thursday' },
    { id: 5, name: 'Fri', fullName: 'Friday' },
    { id: 6, name: 'Sat', fullName: 'Saturday' },
  ];
  
  // Time slots for the day (example: 9 AM to 6 PM in 30-minute increments)
  const generateTimeSlots = () => {
    const timeSlots = [];
    for (let hour = 9; hour < 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const endHour = minute === 30 ? hour + 1 : hour;
        const endMinute = minute === 30 ? 0 : 30;
        const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
        
        timeSlots.push({
          startTime,
          endTime,
          label: `${hour % 12 || 12}:${minute.toString().padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`,
        });
      }
    }
    return timeSlots;
  };
  
  const timeSlots = generateTimeSlots();
  
  // Get availability for a specific time slot
  const getSlotAvailability = (day: number, startTime: string) => {
    const slot = slots.find(s => s.day === day && s.startTime === startTime);
    return slot?.isAvailable ?? false;
  };
  
  // Toggle slot availability
  const toggleSlot = (day: number, startTime: string, endTime: string) => {
    const slotId = `${day}-${startTime}-${endTime}`;
    const currentAvailability = getSlotAvailability(day, startTime);
    const newAvailability = !currentAvailability;
    
    // Update local state
    setSlots(prev => {
      const existingIndex = prev.findIndex(s => s.day === day && s.startTime === startTime);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], isAvailable: newAvailability };
        return updated;
      } else {
        return [...prev, { id: slotId, day, startTime, endTime, isAvailable: newAvailability }];
      }
    });
    
    // Call the callback
    onSlotToggle?.(slotId, newAvailability);
  };
  
  // Format time for display
  const formatTime = (time: string) => {
    const [hour, minute] = time.split(':').map(Number);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
  };
  
  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <div className="h-8 w-48 rounded animate-pulse" style={{ backgroundColor: 'oklch(0.95 0.01 75)' }} />
        <div className="grid grid-cols-7 gap-2">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="h-12 rounded animate-pulse" style={{ backgroundColor: 'oklch(0.95 0.01 75)' }} />
          ))}
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-12 rounded animate-pulse" style={{ backgroundColor: 'oklch(0.95 0.01 75)' }} />
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-4">
      <h2 
        className="text-xl font-semibold mb-6"
        style={{ color: 'oklch(0.20 0.01 264)' }}
      >
        Weekly Availability
      </h2>
      
      {/* Day selector */}
      <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
        {days.map((day) => (
          <button
            key={day.id}
            onClick={() => setSelectedDay(day.id)}
            className={`px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95 flex-shrink-0 ${
              selectedDay === day.id ? 'text-white' : ''
            }`}
            style={{
              backgroundColor: selectedDay === day.id 
                ? 'oklch(0.78 0.10 75)' // Champagne when selected
                : 'oklch(0.96 0.02 75)', // Light champagne when not selected
              color: selectedDay === day.id 
                ? 'white' 
                : 'oklch(0.20 0.01 264)',
              minHeight: '48px', // Touch target minimum
              minWidth: '60px',
            }}
          >
            {day.name}
          </button>
        ))}
      </div>
      
      {/* Time slots for selected day */}
      <div className="space-y-2">
        <h3 
          className="text-lg font-medium mb-4"
          style={{ color: 'oklch(0.20 0.01 264)' }}
        >
          {days.find(d => d.id === selectedDay)?.fullName} Schedule
        </h3>
        
        <div className="space-y-2">
          {timeSlots.map((slot, index) => (
            <div 
              key={index}
              className="flex items-center justify-between p-3 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                backgroundColor: getSlotAvailability(selectedDay, slot.startTime)
                  ? 'oklch(0.96 0.02 75)' // Light champagne for available
                  : 'oklch(0.95 0.01 75)', // Light gray for unavailable
                border: '1px solid oklch(0.90 0.01 85)',
                minHeight: '48px', // Touch target minimum
              }}
            >
              <div className="flex items-center space-x-4">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: getSlotAvailability(selectedDay, slot.startTime)
                      ? 'oklch(0.75 0.15 155)' // Green for available
                      : 'oklch(0.70 0.18 15)', // Red for unavailable
                  }}
                />
                <div>
                  <div 
                    className="font-medium"
                    style={{ color: 'oklch(0.20 0.01 264)' }}
                  >
                    {slot.label}
                  </div>
                  <div 
                    className="text-sm"
                    style={{ color: 'oklch(0.45 0.01 264)' }}
                  >
                    {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => toggleSlot(selectedDay, slot.startTime, slot.endTime)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95 ${
                  getSlotAvailability(selectedDay, slot.startTime) ? 'text-white' : ''
                }`}
                style={{
                  backgroundColor: getSlotAvailability(selectedDay, slot.startTime)
                    ? 'oklch(0.75 0.15 155)' // Green for available
                    : 'oklch(0.70 0.18 15)', // Red for unavailable
                  color: 'white',
                  minHeight: '48px', // Touch target minimum
                }}
              >
                {getSlotAvailability(selectedDay, slot.startTime) ? 'Available' : 'Unavailable'}
              </button>
            </div>
          ))}
        </div>
      </div>
      
      {/* Legend */}
      <div className="mt-6 flex items-center space-x-6">
        <div className="flex items-center space-x-2">
          <div 
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: 'oklch(0.75 0.15 155)' }}
          />
          <span style={{ color: 'oklch(0.45 0.01 264)' }}>Available</span>
        </div>
        <div className="flex items-center space-x-2">
          <div 
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: 'oklch(0.70 0.18 15)' }}
          />
          <span style={{ color: 'oklch(0.45 0.01 264)' }}>Unavailable</span>
        </div>
      </div>
    </div>
  );
}
