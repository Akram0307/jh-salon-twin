/**
 * Staff Availability Page
 * 
 * Allows staff to manage their weekly availability and request time off.
 * Part of the Staff Workspace PWA.
 */

'use client';

import { useState, useEffect } from 'react';
import WeeklyAvailabilityCalendar from '@/components/staff/availability/WeeklyAvailabilityCalendar';
import TimeOffRequestForm from '@/components/staff/availability/TimeOffRequestForm';

// Mock data for development
const mockTimeSlots = [
  { id: '1-09:00', day: 1, startTime: '09:00', endTime: '09:30', isAvailable: true },
  { id: '1-09:30', day: 1, startTime: '09:30', endTime: '10:00', isAvailable: true },
  { id: '1-10:00', day: 1, startTime: '10:00', endTime: '10:30', isAvailable: false },
  { id: '1-10:30', day: 1, startTime: '10:30', endTime: '11:00', isAvailable: true },
  { id: '2-09:00', day: 2, startTime: '09:00', endTime: '09:30', isAvailable: true },
  { id: '2-09:30', day: 2, startTime: '09:30', endTime: '10:00', isAvailable: true },
  { id: '3-14:00', day: 3, startTime: '14:00', endTime: '14:30', isAvailable: false },
  { id: '4-16:00', day: 4, startTime: '16:00', endTime: '16:30', isAvailable: true },
  { id: '5-11:00', day: 5, startTime: '11:00', endTime: '11:30', isAvailable: true },
];

interface TimeOffRequest {
  startDate: string;
  endDate: string;
  reason: string;
  type: 'vacation' | 'sick' | 'personal' | 'other';
}

export default function StaffAvailabilityPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [timeSlots, setTimeSlots] = useState(mockTimeSlots);
  const [activeTab, setActiveTab] = useState<'availability' | 'timeoff'>('availability');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    // Simulate API call
    const fetchData = async () => {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      setTimeSlots(mockTimeSlots);
      setIsLoading(false);
    };

    fetchData();
  }, []);

  // Handle slot toggle
  const handleSlotToggle = (slotId: string, isAvailable: boolean) => {
    console.log(`Slot ${slotId} toggled to ${isAvailable ? 'available' : 'unavailable'}`);
    // In production, this would make an API call
  };

  // Handle time off request submission
  const handleTimeOffSubmit = (request: TimeOffRequest) => {
    console.log('Time off request submitted:', request);
    // In production, this would make an API call
    setSuccessMessage('Time off request submitted successfully!');
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'oklch(0.98 0.005 85)' }}>
      {/* Header */}
      <div 
        className="sticky top-0 z-10 px-4 py-4"
        style={{ 
          backgroundColor: 'oklch(0.98 0.005 85)',
          borderBottom: '1px solid oklch(0.90 0.01 85)',
        }}
      >
        <h1 
          className="text-2xl font-semibold"
          style={{ color: 'oklch(0.20 0.01 264)' }}
        >
          Availability & Time Off
        </h1>
        <p 
          className="text-sm mt-1"
          style={{ color: 'oklch(0.45 0.01 264)' }}
        >
          Manage your schedule and request time off
        </p>
      </div>

      {/* Success Message */}
      {showSuccessMessage && (
        <div 
          className="mx-4 mt-4 p-4 rounded-xl flex items-center space-x-3"
          style={{
            backgroundColor: 'oklch(0.95 0.05 155)', // Light green
            border: '1px solid oklch(0.75 0.15 155)',
          }}
        >
          <span className="text-xl">✓</span>
          <span style={{ color: 'oklch(0.20 0.01 264)' }}>{successMessage}</span>
        </div>
      )}

      {/* Tab Selector */}
      <div className="flex p-4 space-x-2">
        <button
          onClick={() => setActiveTab('availability')}
          className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95 ${
            activeTab === 'availability' ? 'text-white' : ''
          }`}
          style={{
            backgroundColor: activeTab === 'availability' 
              ? 'oklch(0.78 0.10 75)' // Champagne when selected
              : 'oklch(0.96 0.02 75)', // Light champagne when not selected
            color: activeTab === 'availability' 
              ? 'white' 
              : 'oklch(0.20 0.01 264)',
            minHeight: '48px', // Touch target minimum
          }}
        >
          Weekly Schedule
        </button>
        <button
          onClick={() => setActiveTab('timeoff')}
          className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95 ${
            activeTab === 'timeoff' ? 'text-white' : ''
          }`}
          style={{
            backgroundColor: activeTab === 'timeoff' 
              ? 'oklch(0.78 0.10 75)' // Champagne when selected
              : 'oklch(0.96 0.02 75)', // Light champagne when not selected
            color: activeTab === 'timeoff' 
              ? 'white' 
              : 'oklch(0.20 0.01 264)',
            minHeight: '48px', // Touch target minimum
          }}
        >
          Request Time Off
        </button>
      </div>

      {/* Content */}
      <div className="pb-8">
        {activeTab === 'availability' ? (
          <WeeklyAvailabilityCalendar
            initialSlots={timeSlots}
            onSlotToggle={handleSlotToggle}
            isLoading={isLoading}
          />
        ) : (
          <div className="px-4">
            <TimeOffRequestForm
              onSubmit={handleTimeOffSubmit}
              isLoading={isLoading}
            />
          </div>
        )}
      </div>
    </div>
  );
}
