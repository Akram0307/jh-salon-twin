/**
 * Appointment Types for Staff Schedule
 * 
 * Extended types for the Staff Workspace PWA timeline view.
 */

import { Appointment, AppointmentStatus } from './index';

/**
 * StaffAppointment extends Appointment with display information
 * needed for the timeline view.
 */
export interface StaffAppointment extends Appointment {
  // Display fields (populated from joins)
  clientName: string;
  serviceName: string;
  clientPreferences?: string;
  
  // Computed fields
  durationMinutes: number;
  isUpcoming: boolean;
  isCurrent: boolean;
}

/**
 * Appointment with display info for timeline
 * Simplified version for quick rendering
 */
export interface AppointmentDisplay {
  id: string;
  clientName: string;
  serviceName: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  clientPreferences?: string;
  notes?: string;
  durationMinutes: number;
}

/**
 * Re-export base Appointment type
 */
export type { Appointment, AppointmentStatus } from './index';
