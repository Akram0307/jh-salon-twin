/**
 * EarningsSummaryCard Component
 * 
 * Displays earnings summary for a specific period (daily, weekly, monthly).
 * Touch-optimized with minimum 48px touch targets.
 */

'use client';

import { tokens } from '@/lib/design-tokens';

interface EarningsSummaryCardProps {
  period: 'daily' | 'weekly' | 'monthly';
  amount: number;
  change?: number; // Percentage change from previous period
  isLoading?: boolean;
}

export default function EarningsSummaryCard({ 
  period, 
  amount, 
  change = 0, 
  isLoading = false 
}: EarningsSummaryCardProps) {
  
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
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };
  
  // Get period label
  const getPeriodLabel = () => {
    switch (period) {
      case 'daily': return 'Today';
      case 'weekly': return 'This Week';
      case 'monthly': return 'This Month';
    }
  };
  
  // Get change color
  const getChangeColor = () => {
    if (change > 0) return 'oklch(0.75 0.15 155)'; // Green for positive
    if (change < 0) return 'oklch(0.70 0.18 15)'; // Red for negative
    return 'oklch(0.45 0.01 264)'; // Neutral for zero
  };
  
  if (isLoading) {
    return (
      <div 
        className="rounded-xl p-6 animate-pulse"
        style={{ 
          backgroundColor: 'oklch(0.98 0.005 85)',
          border: '1px solid oklch(0.90 0.01 85)',
          minHeight: '120px',
        }}
      >
        <div className="h-4 w-24 rounded mb-4" style={{ backgroundColor: 'oklch(0.95 0.01 75)' }} />
        <div className="h-8 w-32 rounded mb-2" style={{ backgroundColor: 'oklch(0.95 0.01 75)' }} />
        <div className="h-4 w-20 rounded" style={{ backgroundColor: 'oklch(0.95 0.01 75)' }} />
      </div>
    );
  }
  
  return (
    <div 
      className="rounded-xl p-6 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
      style={{ 
        backgroundColor: 'oklch(0.98 0.005 85)',
        border: '1px solid oklch(0.90 0.01 85)',
        minHeight: '120px',
      }}
    >
      <div className="flex justify-between items-start mb-4">
        <h3 
          className="text-sm font-medium"
          style={{ color: 'oklch(0.45 0.01 264)' }}
        >
          {getPeriodLabel()}
        </h3>
        
        {change !== 0 && (
          <span 
            className="text-sm font-medium px-2 py-1 rounded-full"
            style={{
              backgroundColor: change > 0 
                ? 'oklch(0.95 0.05 155)' // Light green
                : 'oklch(0.95 0.05 15)', // Light red
              color: getChangeColor(),
            }}
          >
            {formatPercentage(change)}
          </span>
        )}
      </div>
      
      <div 
        className="text-3xl font-bold mb-2"
        style={{ color: 'oklch(0.20 0.01 264)' }}
      >
        {formatCurrency(amount)}
      </div>
      
      <div 
        className="text-sm"
        style={{ color: 'oklch(0.45 0.01 264)' }}
      >
        {change !== 0 ? 'vs previous period' : 'No comparison data'}
      </div>
    </div>
  );
}
