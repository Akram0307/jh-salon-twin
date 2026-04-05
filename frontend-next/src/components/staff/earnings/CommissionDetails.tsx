/**
 * CommissionDetails Component
 * 
 * Displays commission details including rate, total earnings, commission amount, tips, and total compensation.
 * Touch-optimized with minimum 48px touch targets.
 */

'use client';

import { tokens } from '@/lib/design-tokens';

interface CommissionDetailsProps {
  commission: {
    rate: number;
    totalEarnings: number;
    commissionAmount: number;
    tips: number;
    totalCompensation: number;
  };
  isLoading?: boolean;
}

export default function CommissionDetails({ 
  commission, 
  isLoading = false 
}: CommissionDetailsProps) {
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };
  
  // Format percentage
  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(0)}%`;
  };
  
  if (isLoading) {
    return (
      <div 
        className="rounded-xl p-6 animate-pulse"
        style={{ 
          backgroundColor: 'oklch(0.98 0.005 85)',
          border: '1px solid oklch(0.90 0.01 85)',
          minHeight: '300px',
        }}
      >
        <div className="h-4 w-32 rounded mb-6" style={{ backgroundColor: 'oklch(0.95 0.01 75)' }} />
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex justify-between items-center">
              <div className="h-4 w-24 rounded" style={{ backgroundColor: 'oklch(0.95 0.01 75)' }} />
              <div className="h-4 w-16 rounded" style={{ backgroundColor: 'oklch(0.95 0.01 75)' }} />
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div 
      className="rounded-xl p-6"
      style={{ 
        backgroundColor: 'oklch(0.98 0.005 85)',
        border: '1px solid oklch(0.90 0.01 85)',
        minHeight: '300px',
      }}
    >
      <h3 
        className="text-lg font-semibold mb-6"
        style={{ color: 'oklch(0.20 0.01 264)' }}
      >
        Commission Details
      </h3>
      
      <div className="space-y-4">
        {/* Commission Rate */}
        <div 
          className="flex justify-between items-center p-3 rounded-lg"
          style={{
            backgroundColor: 'oklch(0.96 0.02 75)',
            minHeight: '48px', // Touch target minimum
          }}
        >
          <span style={{ color: 'oklch(0.45 0.01 264)' }}>Commission Rate</span>
          <span 
            className="font-semibold"
            style={{ color: 'oklch(0.20 0.01 264)' }}
          >
            {formatPercentage(commission.rate)}
          </span>
        </div>
        
        {/* Total Earnings */}
        <div 
          className="flex justify-between items-center p-3 rounded-lg"
          style={{
            backgroundColor: 'oklch(0.96 0.02 75)',
            minHeight: '48px', // Touch target minimum
          }}
        >
          <span style={{ color: 'oklch(0.45 0.01 264)' }}>Total Earnings</span>
          <span 
            className="font-semibold"
            style={{ color: 'oklch(0.20 0.01 264)' }}
          >
            {formatCurrency(commission.totalEarnings)}
          </span>
        </div>
        
        {/* Commission Amount */}
        <div 
          className="flex justify-between items-center p-3 rounded-lg"
          style={{
            backgroundColor: 'oklch(0.96 0.02 75)',
            minHeight: '48px', // Touch target minimum
          }}
        >
          <span style={{ color: 'oklch(0.45 0.01 264)' }}>Commission Amount</span>
          <span 
            className="font-semibold"
            style={{ color: 'oklch(0.20 0.01 264)' }}
          >
            {formatCurrency(commission.commissionAmount)}
          </span>
        </div>
        
        {/* Tips */}
        <div 
          className="flex justify-between items-center p-3 rounded-lg"
          style={{
            backgroundColor: 'oklch(0.96 0.02 75)',
            minHeight: '48px', // Touch target minimum
          }}
        >
          <span style={{ color: 'oklch(0.45 0.01 264)' }}>Tips</span>
          <span 
            className="font-semibold"
            style={{ color: 'oklch(0.20 0.01 264)' }}
          >
            {formatCurrency(commission.tips)}
          </span>
        </div>
        
        {/* Total Compensation */}
        <div 
          className="flex justify-between items-center p-3 rounded-lg border-t pt-4 mt-4"
          style={{
            borderColor: 'oklch(0.90 0.01 85)',
            minHeight: '48px', // Touch target minimum
          }}
        >
          <span 
            className="font-semibold"
            style={{ color: 'oklch(0.20 0.01 264)' }}
          >
            Total Compensation
          </span>
          <span 
            className="font-bold text-lg"
            style={{ color: 'oklch(0.20 0.01 264)' }}
          >
            {formatCurrency(commission.totalCompensation)}
          </span>
        </div>
      </div>
    </div>
  );
}
