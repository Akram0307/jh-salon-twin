/**
 * PeriodComparison Component
 * 
 * Displays week-over-week comparison of earnings.
 * Touch-optimized with minimum 48px touch targets.
 */

'use client';

import { tokens } from '@/lib/design-tokens';

interface PeriodComparisonProps {
  data: {
    currentWeek: number;
    previousWeek: number;
    change: number;
    trend: 'up' | 'down' | 'neutral';
  };
  isLoading?: boolean;
}

export default function PeriodComparison({ 
  data, 
  isLoading = false 
}: PeriodComparisonProps) {
  
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
  
  // Get trend color
  const getTrendColor = () => {
    switch (data.trend) {
      case 'up': return 'oklch(0.75 0.15 155)'; // Green
      case 'down': return 'oklch(0.70 0.18 15)'; // Red
      default: return 'oklch(0.45 0.01 264)'; // Neutral
    }
  };
  
  // Get trend icon
  const getTrendIcon = () => {
    switch (data.trend) {
      case 'up': return '↑';
      case 'down': return '↓';
      default: return '→';
    }
  };
  
  if (isLoading) {
    return (
      <div 
        className="rounded-xl p-6 animate-pulse"
        style={{ 
          backgroundColor: 'oklch(0.98 0.005 85)',
          border: '1px solid oklch(0.90 0.01 85)',
          minHeight: '200px',
        }}
      >
        <div className="h-4 w-32 rounded mb-6" style={{ backgroundColor: 'oklch(0.95 0.01 75)' }} />
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="h-4 w-24 rounded" style={{ backgroundColor: 'oklch(0.95 0.01 75)' }} />
            <div className="h-8 w-32 rounded" style={{ backgroundColor: 'oklch(0.95 0.01 75)' }} />
          </div>
          <div className="space-y-4">
            <div className="h-4 w-24 rounded" style={{ backgroundColor: 'oklch(0.95 0.01 75)' }} />
            <div className="h-8 w-32 rounded" style={{ backgroundColor: 'oklch(0.95 0.01 75)' }} />
          </div>
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
        minHeight: '200px',
      }}
    >
      <h3 
        className="text-lg font-semibold mb-6"
        style={{ color: 'oklch(0.20 0.01 264)' }}
      >
        Week-over-Week Comparison
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Current Week */}
        <div 
          className="p-4 rounded-xl"
          style={{
            backgroundColor: 'oklch(0.96 0.02 75)',
            minHeight: '48px', // Touch target minimum
          }}
        >
          <div 
            className="text-sm mb-2"
            style={{ color: 'oklch(0.45 0.01 264)' }}
          >
            This Week
          </div>
          <div 
            className="text-2xl font-bold"
            style={{ color: 'oklch(0.20 0.01 264)' }}
          >
            {formatCurrency(data.currentWeek)}
          </div>
        </div>
        
        {/* Previous Week */}
        <div 
          className="p-4 rounded-xl"
          style={{
            backgroundColor: 'oklch(0.96 0.02 75)',
            minHeight: '48px', // Touch target minimum
          }}
        >
          <div 
            className="text-sm mb-2"
            style={{ color: 'oklch(0.45 0.01 264)' }}
          >
            Last Week
          </div>
          <div 
            className="text-2xl font-bold"
            style={{ color: 'oklch(0.20 0.01 264)' }}
          >
            {formatCurrency(data.previousWeek)}
          </div>
        </div>
      </div>
      
      {/* Change Indicator */}
      <div 
        className="mt-6 p-4 rounded-xl flex items-center justify-between"
        style={{
          backgroundColor: 'oklch(0.96 0.02 75)',
          minHeight: '48px', // Touch target minimum
        }}
      >
        <div className="flex items-center space-x-3">
          <span 
            className="text-2xl"
            style={{ color: getTrendColor() }}
          >
            {getTrendIcon()}
          </span>
          <span 
            className="font-semibold"
            style={{ color: 'oklch(0.20 0.01 264)' }}
          >
            {formatPercentage(data.change)}
          </span>
        </div>
        <span 
          className="text-sm"
          style={{ color: 'oklch(0.45 0.01 264)' }}
        >
          vs last week
        </span>
      </div>
      
      {/* Visual Comparison Bar */}
      <div className="mt-6">
        <div className="flex justify-between text-sm mb-2">
          <span style={{ color: 'oklch(0.45 0.01 264)' }}>This Week</span>
          <span style={{ color: 'oklch(0.45 0.01 264)' }}>Last Week</span>
        </div>
        <div className="relative h-4 rounded-full overflow-hidden" style={{ backgroundColor: 'oklch(0.90 0.01 85)' }}>
          {/* Current week bar */}
          <div 
            className="absolute top-0 left-0 h-full rounded-full"
            style={{
              width: `${(data.currentWeek / Math.max(data.currentWeek, data.previousWeek)) * 100}%`,
              backgroundColor: 'oklch(0.78 0.10 75)', // Champagne
            }}
          />
          {/* Previous week bar (overlay) */}
          <div 
            className="absolute top-0 left-0 h-full rounded-full opacity-50"
            style={{
              width: `${(data.previousWeek / Math.max(data.currentWeek, data.previousWeek)) * 100}%`,
              backgroundColor: 'oklch(0.72 0.12 25)', // Rose gold
            }}
          />
        </div>
      </div>
    </div>
  );
}
