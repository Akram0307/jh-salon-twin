/**
 * ConfirmationCard Component
 * 
 * Displays booking details for confirmation in the Client PWA.
 * Allows the user to review and confirm their booking.
 */

'use client';

import { BookingData } from '@/lib/state-machines/bookingStateMachine';
import { tokens } from '@/lib/design-tokens';

interface ConfirmationCardProps {
  bookingData: BookingData;
  onConfirm: () => void;
  onEdit: () => void;
  onCancel: () => void;
}

export default function ConfirmationCard({ 
  bookingData, 
  onConfirm, 
  onEdit, 
  onCancel 
}: ConfirmationCardProps) {
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
      className="rounded-xl p-4"
      style={{ 
        backgroundColor: 'oklch(0.98 0.005 85)',
        border: '1px solid oklch(0.90 0.01 85)',
      }}
    >
      <h3 
        className="font-semibold text-lg mb-4"
        style={{ color: 'oklch(0.20 0.01 264)' }}
      >
        Booking Summary
      </h3>
      
      <div className="space-y-4">
        {/* Service */}
        <div className="flex justify-between items-start">
          <div>
            <p 
              className="text-sm font-medium"
              style={{ color: 'oklch(0.45 0.01 264)' }}
            >
              Service
            </p>
            <p 
              className="font-semibold"
              style={{ color: 'oklch(0.20 0.01 264)' }}
            >
              {bookingData.service?.name || 'Not selected'}
            </p>
            {bookingData.service && (
              <p 
                className="text-sm mt-1"
                style={{ color: 'oklch(0.45 0.01 264)' }}
              >
                {bookingData.service.duration} minutes • ${bookingData.service.price}
              </p>
            )}
          </div>
          {bookingData.service?.imageUrl && (
            <div 
              className="w-16 h-16 rounded-lg bg-cover bg-center"
              style={{ 
                backgroundImage: `url(${bookingData.service.imageUrl})`,
                backgroundColor: 'oklch(0.95 0.01 75)',
              }}
            />
          )}
        </div>
        
        {/* Date */}
        <div>
          <p 
            className="text-sm font-medium"
            style={{ color: 'oklch(0.45 0.01 264)' }}
          >
            Date
          </p>
          <p 
            className="font-semibold"
            style={{ color: 'oklch(0.20 0.01 264)' }}
          >
            {formatDate(bookingData.date)}
          </p>
        </div>
        
        {/* Time */}
        <div>
          <p 
            className="text-sm font-medium"
            style={{ color: 'oklch(0.45 0.01 264)' }}
          >
            Time
          </p>
          <p 
            className="font-semibold"
            style={{ color: 'oklch(0.20 0.01 264)' }}
          >
            {bookingData.slot ? `${bookingData.slot.startTime} - ${bookingData.slot.endTime}` : 'Not selected'}
          </p>
        </div>
        
        {/* Stylist */}
        <div>
          <p 
            className="text-sm font-medium"
            style={{ color: 'oklch(0.45 0.01 264)' }}
          >
            Stylist
          </p>
          <p 
            className="font-semibold"
            style={{ color: 'oklch(0.20 0.01 264)' }}
          >
            {bookingData.stylist?.name || 'Any available stylist'}
          </p>
        </div>
        
        {/* Notes */}
        {bookingData.notes && (
          <div>
            <p 
              className="text-sm font-medium"
              style={{ color: 'oklch(0.45 0.01 264)' }}
            >
              Notes
            </p>
            <p 
              className="text-sm"
              style={{ color: 'oklch(0.20 0.01 264)' }}
            >
              {bookingData.notes}
            </p>
          </div>
        )}
        
        {/* Total */}
        <div 
          className="pt-4 mt-4 border-t"
          style={{ borderColor: 'oklch(0.90 0.01 85)' }}
        >
          <div className="flex justify-between items-center">
            <p 
              className="font-semibold text-lg"
              style={{ color: 'oklch(0.20 0.01 264)' }}
            >
              Total
            </p>
            <p 
              className="font-bold text-xl"
              style={{ color: 'oklch(0.78 0.10 75)' }}
            >
              ${bookingData.service?.price || 0}
            </p>
          </div>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="mt-6 space-y-3">
        <button
          onClick={onConfirm}
          className="w-full py-3 px-4 rounded-xl font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          style={{
            backgroundColor: 'oklch(0.78 0.10 75)', // Champagne
            color: 'white',
            minHeight: '48px', // Touch target minimum
          }}
        >
          Confirm Booking
        </button>
        
        <div className="flex space-x-3">
          <button
            onClick={onEdit}
            className="flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            style={{
              backgroundColor: 'oklch(0.96 0.02 75)', // Light champagne
              color: 'oklch(0.20 0.01 264)',
              border: '1px solid oklch(0.90 0.01 85)',
              minHeight: '48px', // Touch target minimum
            }}
          >
            Edit Details
          </button>
          
          <button
            onClick={onCancel}
            className="flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            style={{
              backgroundColor: 'oklch(0.98 0.005 85)', // Warm ivory
              color: 'oklch(0.45 0.01 264)',
              border: '1px solid oklch(0.90 0.01 85)',
              minHeight: '48px', // Touch target minimum
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
