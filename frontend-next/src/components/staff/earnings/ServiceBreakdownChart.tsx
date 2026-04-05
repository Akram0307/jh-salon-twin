/**
 * ServiceBreakdownChart Component
 * 
 * Displays a breakdown of earnings by service type.
 * Touch-optimized with minimum 48px touch targets.
 */

'use client';

import { tokens } from '@/lib/design-tokens';

interface ServiceBreakdownItem {
  service: string;
  amount: number;
  percentage: number;
}

interface ServiceBreakdownChartProps {
  data: ServiceBreakdownItem[];
  isLoading?: boolean;
}

export default function ServiceBreakdownChart({ 
  data, 
  isLoading = false 
}: ServiceBreakdownChartProps) {
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };
  
  // Get color for service type
  const getServiceColor = (index: number) => {
    const colors = [
      'oklch(0.78 0.10 75)', // Champagne
      'oklch(0.72 0.12 25)', // Rose gold
      'oklch(0.75 0.08 145)', // Sage
      'oklch(0.70 0.15 264)', // Blue
    ];
    return colors[index % colors.length];
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
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center space-x-4">
              <div className="h-4 w-24 rounded" style={{ backgroundColor: 'oklch(0.95 0.01 75)' }} />
              <div className="flex-1 h-4 rounded" style={{ backgroundColor: 'oklch(0.95 0.01 75)' }} />
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
        Service Breakdown
      </h3>
      
      <div className="space-y-4">
        {data.map((item, index) => (
          <div 
            key={item.service}
            className="flex items-center space-x-4 p-3 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            style={{
              backgroundColor: 'oklch(0.96 0.02 75)',
              minHeight: '48px', // Touch target minimum
            }}
          >
            {/* Service color indicator */}
            <div 
              className="w-4 h-4 rounded-full flex-shrink-0"
              style={{ backgroundColor: getServiceColor(index) }}
            />
            
            {/* Service name */}
            <div className="flex-1 min-w-0">
              <div 
                className="font-medium truncate"
                style={{ color: 'oklch(0.20 0.01 264)' }}
              >
                {item.service}
              </div>
              <div 
                className="text-sm"
                style={{ color: 'oklch(0.45 0.01 264)' }}
              >
                {item.percentage}% of total
              </div>
            </div>
            
            {/* Amount */}
            <div 
              className="font-semibold"
              style={{ color: 'oklch(0.20 0.01 264)' }}
            >
              {formatCurrency(item.amount)}
            </div>
            
            {/* Progress bar */}
            <div className="w-24 h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'oklch(0.90 0.01 85)' }}>
              <div 
                className="h-full rounded-full"
                style={{ 
                  width: `${item.percentage}%`,
                  backgroundColor: getServiceColor(index),
                }}
              />
            </div>
          </div>
        ))}
      </div>
      
      {/* Total */}
      <div 
        className="mt-6 pt-4 border-t flex justify-between items-center"
        style={{ borderColor: 'oklch(0.90 0.01 85)' }}
      >
        <span 
          className="font-medium"
          style={{ color: 'oklch(0.45 0.01 264)' }}
        >
          Total
        </span>
        <span 
          className="font-bold text-lg"
          style={{ color: 'oklch(0.20 0.01 264)' }}
        >
          {formatCurrency(data.reduce((sum, item) => sum + item.amount, 0))}
        </span>
      </div>
    </div>
  );
}
