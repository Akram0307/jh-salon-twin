/**
 * TimeOffRequestForm Component
 * 
 * Form for staff to request time off.
 * Touch-optimized with minimum 48px touch targets.
 */

'use client';

import { useState } from 'react';
import { tokens } from '@/lib/design-tokens';

interface TimeOffRequestFormProps {
  onSubmit?: (request: TimeOffRequest) => void;
  isLoading?: boolean;
}

interface TimeOffRequest {
  startDate: string;
  endDate: string;
  reason: string;
  type: 'vacation' | 'sick' | 'personal' | 'other';
}

export default function TimeOffRequestForm({ 
  onSubmit, 
  isLoading = false 
}: TimeOffRequestFormProps) {
  const [formData, setFormData] = useState<TimeOffRequest>({
    startDate: '',
    endDate: '',
    reason: '',
    type: 'vacation',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }
    
    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    } else if (formData.startDate && formData.endDate < formData.startDate) {
      newErrors.endDate = 'End date must be after start date';
    }
    
    if (!formData.reason.trim()) {
      newErrors.reason = 'Reason is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit?.(formData);
      // Reset form after successful submission
      setFormData({
        startDate: '',
        endDate: '',
        reason: '',
        type: 'vacation',
      });
    }
  };
  
  // Time off types
  const timeOffTypes = [
    { value: 'vacation', label: 'Vacation' },
    { value: 'sick', label: 'Sick Leave' },
    { value: 'personal', label: 'Personal' },
    { value: 'other', label: 'Other' },
  ];
  
  if (isLoading) {
    return (
      <div 
        className="rounded-xl p-6 animate-pulse"
        style={{ 
          backgroundColor: 'oklch(0.98 0.005 85)',
          border: '1px solid oklch(0.90 0.01 85)',
          minHeight: '400px',
        }}
      >
        <div className="h-6 w-48 rounded mb-6" style={{ backgroundColor: 'oklch(0.95 0.01 75)' }} />
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i}>
              <div className="h-4 w-24 rounded mb-2" style={{ backgroundColor: 'oklch(0.95 0.01 75)' }} />
              <div className="h-12 w-full rounded" style={{ backgroundColor: 'oklch(0.95 0.01 75)' }} />
            </div>
          ))}
          <div className="h-12 w-full rounded mt-6" style={{ backgroundColor: 'oklch(0.95 0.01 75)' }} />
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
        minHeight: '400px',
      }}
    >
      <h3 
        className="text-lg font-semibold mb-6"
        style={{ color: 'oklch(0.20 0.01 264)' }}
      >
        Request Time Off
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Time off type */}
        <div>
          <label 
            htmlFor="type"
            className="block text-sm font-medium mb-2"
            style={{ color: 'oklch(0.45 0.01 264)' }}
          >
            Type of Leave
          </label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2"
            style={{
              backgroundColor: 'oklch(0.96 0.02 75)',
              border: '1px solid oklch(0.90 0.01 85)',
              color: 'oklch(0.20 0.01 264)',
              minHeight: '48px', // Touch target minimum
            }}
          >
            {timeOffTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
        
        {/* Start date */}
        <div>
          <label 
            htmlFor="startDate"
            className="block text-sm font-medium mb-2"
            style={{ color: 'oklch(0.45 0.01 264)' }}
          >
            Start Date
          </label>
          <input
            type="date"
            id="startDate"
            name="startDate"
            value={formData.startDate}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2"
            style={{
              backgroundColor: 'oklch(0.96 0.02 75)',
              border: errors.startDate 
                ? '1px solid oklch(0.70 0.18 15)' 
                : '1px solid oklch(0.90 0.01 85)',
              color: 'oklch(0.20 0.01 264)',
              minHeight: '48px', // Touch target minimum
            }}
          />
          {errors.startDate && (
            <p 
              className="mt-2 text-sm"
              style={{ color: 'oklch(0.70 0.18 15)' }}
            >
              {errors.startDate}
            </p>
          )}
        </div>
        
        {/* End date */}
        <div>
          <label 
            htmlFor="endDate"
            className="block text-sm font-medium mb-2"
            style={{ color: 'oklch(0.45 0.01 264)' }}
          >
            End Date
          </label>
          <input
            type="date"
            id="endDate"
            name="endDate"
            value={formData.endDate}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2"
            style={{
              backgroundColor: 'oklch(0.96 0.02 75)',
              border: errors.endDate 
                ? '1px solid oklch(0.70 0.18 15)' 
                : '1px solid oklch(0.90 0.01 85)',
              color: 'oklch(0.20 0.01 264)',
              minHeight: '48px', // Touch target minimum
            }}
          />
          {errors.endDate && (
            <p 
              className="mt-2 text-sm"
              style={{ color: 'oklch(0.70 0.18 15)' }}
            >
              {errors.endDate}
            </p>
          )}
        </div>
        
        {/* Reason */}
        <div>
          <label 
            htmlFor="reason"
            className="block text-sm font-medium mb-2"
            style={{ color: 'oklch(0.45 0.01 264)' }}
          >
            Reason
          </label>
          <textarea
            id="reason"
            name="reason"
            value={formData.reason}
            onChange={handleChange}
            rows={4}
            className="w-full px-4 py-3 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 resize-none"
            style={{
              backgroundColor: 'oklch(0.96 0.02 75)',
              border: errors.reason 
                ? '1px solid oklch(0.70 0.18 15)' 
                : '1px solid oklch(0.90 0.01 85)',
              color: 'oklch(0.20 0.01 264)',
              minHeight: '120px', // Minimum height for textarea
            }}
            placeholder="Please provide a reason for your time off request..."
          />
          {errors.reason && (
            <p 
              className="mt-2 text-sm"
              style={{ color: 'oklch(0.70 0.18 15)' }}
            >
              {errors.reason}
            </p>
          )}
        </div>
        
        {/* Submit button */}
        <button
          type="submit"
          className="w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          style={{
            backgroundColor: 'oklch(0.78 0.10 75)', // Champagne
            color: 'white',
            minHeight: '48px', // Touch target minimum
          }}
        >
          Submit Request
        </button>
      </form>
    </div>
  );
}
