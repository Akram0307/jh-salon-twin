/**
 * Staff Earnings Dashboard Page
 * 
 * Displays earnings summary, service breakdown, commission details, and period comparisons.
 * Part of the Staff Workspace PWA.
 */

'use client';

import { useState, useEffect } from 'react';
import EarningsSummaryCard from '@/components/staff/earnings/EarningsSummaryCard';
import ServiceBreakdownChart from '@/components/staff/earnings/ServiceBreakdownChart';
import CommissionDetails from '@/components/staff/earnings/CommissionDetails';
import PeriodComparison from '@/components/staff/earnings/PeriodComparison';

// Mock data for development
const mockEarningsData = {
  daily: {
    amount: 450,
    change: 12.5, // Percentage change from previous day
  },
  weekly: {
    amount: 2850,
    change: 8.2, // Percentage change from previous week
  },
  monthly: {
    amount: 12500,
    change: -2.1, // Percentage change from previous month
  },
  serviceBreakdown: [
    { service: 'Haircut', amount: 1200, percentage: 42 },
    { service: 'Coloring', amount: 850, percentage: 30 },
    { service: 'Styling', amount: 450, percentage: 16 },
    { service: 'Treatments', amount: 350, percentage: 12 },
  ],
  commission: {
    rate: 0.45, // 45% commission rate
    totalEarnings: 12500,
    commissionAmount: 5625,
    tips: 850,
    totalCompensation: 6475,
  },
  periodComparison: {
    currentWeek: 2850,
    previousWeek: 2635,
    change: 8.2,
    trend: 'up',
  },
};

export default function StaffEarningsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [earningsData, setEarningsData] = useState(mockEarningsData);
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  useEffect(() => {
    // Simulate API call
    const fetchEarningsData = async () => {
      setIsLoading(true);
      // In production, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 500));
      setEarningsData(mockEarningsData);
      setIsLoading(false);
    };

    fetchEarningsData();
  }, [selectedPeriod]);

  return (
    <div className="min-h-screen p-4" style={{ backgroundColor: 'oklch(0.98 0.005 85)' }}>
      {/* Header */}
      <div className="mb-6">
        <h1 
          className="text-2xl font-semibold mb-2"
          style={{ color: 'oklch(0.20 0.01 264)' }}
        >
          Earnings Dashboard
        </h1>
        <p 
          className="text-sm"
          style={{ color: 'oklch(0.45 0.01 264)' }}
        >
          Track your earnings, commissions, and performance
        </p>
      </div>

      {/* Period Selector */}
      <div className="flex space-x-2 mb-6">
        {(['daily', 'weekly', 'monthly'] as const).map((period) => (
          <button
            key={period}
            onClick={() => setSelectedPeriod(period)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95 ${
              selectedPeriod === period ? 'text-white' : ''
            }`}
            style={{
              backgroundColor: selectedPeriod === period 
                ? 'oklch(0.78 0.10 75)' // Champagne when selected
                : 'oklch(0.96 0.02 75)', // Light champagne when not selected
              color: selectedPeriod === period 
                ? 'white' 
                : 'oklch(0.20 0.01 264)',
              minHeight: '48px', // Touch target minimum
            }}
          >
            {period.charAt(0).toUpperCase() + period.slice(1)}
          </button>
        ))}
      </div>

      {/* Earnings Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <EarningsSummaryCard
          period="daily"
          amount={earningsData.daily.amount}
          change={earningsData.daily.change}
          isLoading={isLoading}
        />
        <EarningsSummaryCard
          period="weekly"
          amount={earningsData.weekly.amount}
          change={earningsData.weekly.change}
          isLoading={isLoading}
        />
        <EarningsSummaryCard
          period="monthly"
          amount={earningsData.monthly.amount}
          change={earningsData.monthly.change}
          isLoading={isLoading}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Service Breakdown Chart */}
        <div className="lg:col-span-1">
          <ServiceBreakdownChart
            data={earningsData.serviceBreakdown}
            isLoading={isLoading}
          />
        </div>

        {/* Commission Details */}
        <div className="lg:col-span-1">
          <CommissionDetails
            commission={earningsData.commission}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Period Comparison */}
      <div className="mb-6">
        <PeriodComparison
          data={earningsData.periodComparison}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
