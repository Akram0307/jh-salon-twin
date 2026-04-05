/**
 * SuccessState Component
 * 
 * Displays a success message and booking reference after a successful booking.
 * Used in the Client PWA booking flow.
 */

'use client';

import { BookingData } from '@/lib/state-machines/bookingStateMachine';
import { tokens } from '@/lib/design-tokens';

interface SuccessStateProps {
  bookingData: BookingData;
  bookingReference: string;
  onBookAnother: () => void;
  onGoHome: () => void;
}

export default function SuccessState({ 
  bookingData, 
  bookingReference, 
  onBookAnother, 
  onGoHome 
}: SuccessStateProps) {
  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not selected';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };
  
  return (
    <div 
      className="rounded-xl p-6 text-center"
      style={{ 
        backgroundColor: 'oklch(0.98 0.005 85)',
        border: '1px solid oklch(0.90 0.01 85)',
      }}
    >
      {/* Success Icon */}
      <div 
        className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
        style={{ backgroundColor: 'oklch(0.70 0.18 145)' }} // Success green
      >
        <span className="text-white text-2xl">✓</span>
      </div>
      
      <h3 
        className="font-semibold text-xl mb-2"
        style={{ color: 'oklch(0.20 0.01 264)' }}
      >
        Booking Confirmed!
      </h3>
      
      <p 
        className="text-sm mb-6"
        style={{ color: 'oklch(0.45 0.01 264)' }}
      >
        Your appointment has been successfully booked.
      </p>
      
      {/* Booking Reference */}
      <div 
        className="p-4 rounded-lg mb-6"
        style={{ 
          backgroundColor: 'oklch(0.96 0.02 75)', // Light champagne
          border: '1px solid oklch(0.90 0.01 85)',
        }}
      >
        <p 
          className="text-sm font-medium mb-1"
          style={{ color: 'oklch(0.45 0.01 264)' }}
        >
          Booking Reference
        </p>
        <p 
          className="font-bold text-lg"
          style={{ color: 'oklch(0.20 0.01 264)' }}
        >
          {bookingReference}
        </p>
      </div>
      
      {/* Booking Details Summary */}
      <div className="text-left space-y-3 mb-6">
        <div className="flex justify-between">
          <span style={{ color: 'oklch(0.45 0.01 264)' }}>Service</span>
          <span style={{ color: 'oklch(0.20 0.01 264)' }}>
            {bookingData.service?.name || 'Not selected'}
          </span>
        </div>
        <div className="flex justify-between">
          <span style={{ color: 'oklch(0.45 0.01 264)' }}>Date</span>
          <span style={{ color: 'oklch(0.20 0.01 264)' }}>
            {formatDate(bookingData.date)}
          </span>
        </div>
        <div className="flex justify-between">
          <span style={{ color: 'oklch(0.45 0.01 264)' }}>Time</span>
          <span style={{ color: 'oklch(0.20 0.01 264)' }}>
            {bookingData.slot ? `${bookingData.slot.startTime} - ${bookingData.slot.endTime}` : 'Not selected'}
          </span>
        </div>
        <div className="flex justify-between">
          <span style={{ color: 'oklch(0.45 0.01 264)' }}>Stylist</span>
          <span style={{ color: 'oklch(0.20 0.01 264)' }}>
            {bookingData.stylist?.name || 'Any available stylist'}
          </span>
        </div>
        <div className="flex justify-between font-semibold pt-2 border-t" style={{ borderColor: 'oklch(0.90 0.01 85)' }}>
          <span style={{ color: 'oklch(0.20 0.01 264)' }}>Total</span>
          <span style={{ color: 'oklch(0.78 0.10 75)' }}>
            ${bookingData.service?.price || 0}
          </span>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="space-y-3">
        <button
          onClick={onBookAnother}
          className="w-full py-3 px-4 rounded-xl font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          style={{
            backgroundColor: 'oklch(0.78 0.10 75)', // Champagne
            color: 'white',
            minHeight: '48px', // Touch target minimum
          }}
        >
          Book Another Appointment
        </button>
        
        <button
          onClick={onGoHome}
          className="w-full py-3 px-4 rounded-xl font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          style={{
            backgroundColor: 'oklch(0.98 0.005 85)', // Warm ivory
            color: 'oklch(0.20 0.01 264)',
            border: '1px solid oklch(0.90 0.01 85)',
            minHeight: '48px', // Touch target minimum
          }}
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}
