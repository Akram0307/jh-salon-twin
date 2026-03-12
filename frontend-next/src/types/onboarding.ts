// Onboarding Types for Integrated Owner Dashboard

export type OnboardingStage = 'setup' | 'ready_to_launch' | 'operational';

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  required: boolean;
  route?: string;
  actionLabel: string;
  icon: string;
}

export interface OnboardingState {
  stage: OnboardingStage;
  salonName: string | null;
  steps: OnboardingStep[];
  progress: number; // 0-100
  launchBlockers: string[];
  lastUpdated: string;
}

export interface SalonProfile {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  timezone: string;
  currency: string;
}

export interface BusinessHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

export interface DayHours {
  isOpen: boolean;
  openTime?: string; // HH:mm
  closeTime?: string; // HH:mm
}

export const DEFAULT_BUSINESS_HOURS: BusinessHours = {
  monday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
  tuesday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
  wednesday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
  thursday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
  friday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
  saturday: { isOpen: true, openTime: '10:00', closeTime: '16:00' },
  sunday: { isOpen: false },
};

export const ONBOARDING_STORAGE_KEY = 'salonos_onboarding_state';

export const DEFAULT_ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'profile',
    title: 'Salon Profile',
    description: 'Set your salon name, contact info, and location',
    completed: false,
    required: true,
    route: '/owner/settings',
    actionLabel: 'Set Up Profile',
    icon: 'Building2',
  },
  {
    id: 'services',
    title: 'Service Catalog',
    description: 'Add your services with pricing and duration',
    completed: false,
    required: true,
    route: '/owner/services',
    actionLabel: 'Add Services',
    icon: 'Scissors',
  },
  {
    id: 'staff',
    title: 'Staff Members',
    description: 'Add your team and set their schedules',
    completed: false,
    required: true,
    route: '/owner/staff',
    actionLabel: 'Add Staff',
    icon: 'Users',
  },
  {
    id: 'hours',
    title: 'Business Hours',
    description: 'Configure when your salon is open',
    completed: false,
    required: true,
    route: '/owner/settings',
    actionLabel: 'Set Hours',
    icon: 'Clock',
  },
  {
    id: 'booking_rules',
    title: 'Booking Rules',
    description: 'Set cancellation policy and booking windows',
    completed: false,
    required: false,
    route: '/owner/settings',
    actionLabel: 'Configure',
    icon: 'Settings',
  },
];
