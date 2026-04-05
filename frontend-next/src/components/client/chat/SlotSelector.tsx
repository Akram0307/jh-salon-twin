/**
 * SlotSelector Component
 * 
 * Displays available time slots for a given date and service.
 * Used in the booking flow to select a time slot.
 */

'use client';

import { TimeSlot } from '@/lib/state-machines/bookingStateMachine';
import { tokens } from '@/lib/design-tokens';

interface SlotSelectorProps {
  slots: TimeSlot[];
  selectedSlot: TimeSlot | null;
  onSelectSlot: (slot: TimeSlot) => void;
  isLoading?: boolean;
}

export default function SlotSelector({ 
  slots, 
  selectedSlot, 
  onSelectSlot, 
  isLoading = false 
}: SlotSelectorProps) {
  // Group slots by time period (morning, afternoon, evening)
  const groupSlots = () => {
    const groups = {
      morning: [] as TimeSlot[],
      afternoon: [] as TimeSlot[],
      evening: [] as TimeSlot[],
    };
    
    slots.forEach(slot => {
      const hour = parseInt(slot.startTime.split(':')[0]);
      if (hour < 12) groups.morning.push(slot);
      else if (hour < 17) groups.afternoon.push(slot);
      else groups.evening.push(slot);
    });
    
    return groups;
  };
  
  const groups = groupSlots();
  
  // Format time for display
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="text-sm font-medium" style={{ color: 'oklch(0.20 0.01 264)' }}>
          Loading available times...
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div 
              key={i}
              className="h-12 rounded-lg animate-pulse"
              style={{ backgroundColor: 'oklch(0.95 0.01 75)' }}
            />
          ))}
        </div>
      </div>
    );
  }
  
  if (slots.length === 0) {
    return (
      <div 
        className="p-4 rounded-xl text-center"
        style={{ 
          backgroundColor: 'oklch(0.98 0.005 85)',
          border: '1px solid oklch(0.90 0.01 85)',
        }}
      >
        <p style={{ color: 'oklch(0.45 0.01 264)' }}>
          No available time slots for this date. Please try another date.
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Morning slots */}
      {groups.morning.length > 0 && (
        <div>
          <h4 
            className="text-sm font-medium mb-3"
            style={{ color: 'oklch(0.20 0.01 264)' }}
          >
            Morning
          </h4>
          <div className="grid grid-cols-3 gap-2">
            {groups.morning.map((slot) => (
              <button
                key={slot.id}
                onClick={() => slot.available && onSelectSlot(slot)}
                disabled={!slot.available}
                className={`p-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  selectedSlot?.id === slot.id 
                    ? 'ring-2' 
                    : slot.available 
                      ? 'hover:scale-105 active:scale-95' 
                      : 'opacity-50 cursor-not-allowed'
                }`}
                style={{
                  backgroundColor: selectedSlot?.id === slot.id 
                    ? 'oklch(0.78 0.10 75)' // Champagne for selected
                    : slot.available 
                      ? 'oklch(0.98 0.005 85)' // Warm ivory for available
                      : 'oklch(0.95 0.01 75)', // Gray for unavailable
                  color: selectedSlot?.id === slot.id 
                    ? 'white' 
                    : slot.available 
                      ? 'oklch(0.20 0.01 264)' 
                      : 'oklch(0.45 0.01 264)',
                  border: selectedSlot?.id === slot.id 
                    ? '2px solid oklch(0.78 0.10 75)' 
                    : '1px solid oklch(0.90 0.01 85)',
                  minHeight: '48px', // Touch target minimum
                }}
              >
                {formatTime(slot.startTime)}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Afternoon slots */}
      {groups.afternoon.length > 0 && (
        <div>
          <h4 
            className="text-sm font-medium mb-3"
            style={{ color: 'oklch(0.20 0.01 264)' }}
          >
            Afternoon
          </h4>
          <div className="grid grid-cols-3 gap-2">
            {groups.afternoon.map((slot) => (
              <button
                key={slot.id}
                onClick={() => slot.available && onSelectSlot(slot)}
                disabled={!slot.available}
                className={`p-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  selectedSlot?.id === slot.id 
                    ? 'ring-2' 
                    : slot.available 
                      ? 'hover:scale-105 active:scale-95' 
                      : 'opacity-50 cursor-not-allowed'
                }`}
                style={{
                  backgroundColor: selectedSlot?.id === slot.id 
                    ? 'oklch(0.78 0.10 75)' // Champagne for selected
                    : slot.available 
                      ? 'oklch(0.98 0.005 85)' // Warm ivory for available
                      : 'oklch(0.95 0.01 75)', // Gray for unavailable
                  color: selectedSlot?.id === slot.id 
                    ? 'white' 
                    : slot.available 
                      ? 'oklch(0.20 0.01 264)' 
                      : 'oklch(0.45 0.01 264)',
                  border: selectedSlot?.id === slot.id 
                    ? '2px solid oklch(0.78 0.10 75)' 
                    : '1px solid oklch(0.90 0.01 85)',
                  minHeight: '48px', // Touch target minimum
                }}
              >
                {formatTime(slot.startTime)}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Evening slots */}
      {groups.evening.length > 0 && (
        <div>
          <h4 
            className="text-sm font-medium mb-3"
            style={{ color: 'oklch(0.20 0.01 264)' }}
          >
            Evening
          </h4>
          <div className="grid grid-cols-3 gap-2">
            {groups.evening.map((slot) => (
              <button
                key={slot.id}
                onClick={() => slot.available && onSelectSlot(slot)}
                disabled={!slot.available}
                className={`p-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  selectedSlot?.id === slot.id 
                    ? 'ring-2' 
                    : slot.available 
                      ? 'hover:scale-105 active:scale-95' 
                      : 'opacity-50 cursor-not-allowed'
                }`}
                style={{
                  backgroundColor: selectedSlot?.id === slot.id 
                    ? 'oklch(0.78 0.10 75)' // Champagne for selected
                    : slot.available 
                      ? 'oklch(0.98 0.005 85)' // Warm ivory for available
                      : 'oklch(0.95 0.01 75)', // Gray for unavailable
                  color: selectedSlot?.id === slot.id 
                    ? 'white' 
                    : slot.available 
                      ? 'oklch(0.20 0.01 264)' 
                      : 'oklch(0.45 0.01 264)',
                  border: selectedSlot?.id === slot.id 
                    ? '2px solid oklch(0.78 0.10 75)' 
                    : '1px solid oklch(0.90 0.01 85)',
                  minHeight: '48px', // Touch target minimum
                }}
              >
                {formatTime(slot.startTime)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
