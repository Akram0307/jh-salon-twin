/**
 * SalonOS Test Utilities
 * Custom render function, mocks, and test data factories
 */

import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

// ============================================
// Custom Render with Providers
// ============================================

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  // Add custom options here if needed
}

function AllTheProviders({ children }: { children: React.ReactNode }) {
  return (
    <div data-testid="test-wrapper">
      {children}
    </div>
  );
}

function customRender(
  ui: ReactElement,
  options?: CustomRenderOptions
) {
  return {
    user: userEvent.setup(),
    ...render(ui, { wrapper: AllTheProviders, ...options }),
  };
}

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };

// ============================================
// Mock API Responses
// ============================================

export const mockApiResponses = {
  login: {
    success: {
      user: {
        id: 'user-123',
        email: 'owner@salon.com',
        name: 'Test Owner',
        role: 'owner',
        salonId: 'salon-456',
      },
      token: 'mock-jwt-token',
    },
    failure: {
      error: 'Invalid credentials',
      code: 'AUTH_FAILED',
    },
  },
  dashboard: {
    kpis: {
      todayRevenue: 2450,
      todayAppointments: 18,
      newClients: 5,
      rebookingRate: 0.72,
    },
    alerts: [
      { id: '1', type: 'warning', message: 'Staff member running late', timestamp: '2024-01-15T09:30:00Z' },
      { id: '2', type: 'info', message: 'New booking received', timestamp: '2024-01-15T10:00:00Z' },
    ],
  },
  clients: [
    { id: '1', name: 'Jane Doe', email: 'jane@example.com', phone: '555-0101', visits: 12, lastVisit: '2024-01-10' },
    { id: '2', name: 'John Smith', email: 'john@example.com', phone: '555-0102', visits: 5, lastVisit: '2024-01-12' },
  ],
  staff: [
    { id: '1', name: 'Sarah Johnson', role: 'stylist', status: 'active', rating: 4.8, appointments: 8 },
    { id: '2', name: 'Mike Chen', role: 'colorist', status: 'active', rating: 4.9, appointments: 6 },
  ],
  services: [
    { id: '1', name: 'Haircut', duration: 30, price: 45, category: 'hair' },
    { id: '2', name: 'Color', duration: 90, price: 120, category: 'color' },
  ],
};

// ============================================
// Test Data Factories
// ============================================

export function createMockUser(overrides = {}) {
  return {
    id: 'user-' + Math.random().toString(36).substr(2, 9),
    email: 'test@salon.com',
    name: 'Test User',
    role: 'owner' as const,
    salonId: 'salon-123',
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

export function createMockClient(overrides = {}) {
  return {
    id: 'client-' + Math.random().toString(36).substr(2, 9),
    name: 'Test Client',
    email: 'client@example.com',
    phone: '555-0000',
    visits: 1,
    lastVisit: new Date().toISOString().split('T')[0],
    notes: '',
    ...overrides,
  };
}

export function createMockStaff(overrides = {}) {
  return {
    id: 'staff-' + Math.random().toString(36).substr(2, 9),
    name: 'Test Staff',
    email: 'staff@salon.com',
    role: 'stylist' as const,
    status: 'active' as const,
    rating: 4.5,
    appointments: 0,
    ...overrides,
  };
}

export function createMockService(overrides = {}) {
  return {
    id: 'service-' + Math.random().toString(36).substr(2, 9),
    name: 'Test Service',
    duration: 60,
    price: 50,
    category: 'general',
    description: 'A test service',
    ...overrides,
  };
}

export function createMockAppointment(overrides = {}) {
  return {
    id: 'appt-' + Math.random().toString(36).substr(2, 9),
    clientId: 'client-123',
    staffId: 'staff-123',
    serviceId: 'service-123',
    date: new Date().toISOString().split('T')[0],
    time: '10:00',
    status: 'confirmed' as const,
    ...overrides,
  };
}

// ============================================
// Mock Fetch Helper
// ============================================

export function mockFetchSuccess(data: unknown) {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  });
}

export function mockFetchError(status: number, message: string) {
  return vi.fn().mockResolvedValue({
    ok: false,
    status,
    json: () => Promise.resolve({ error: message }),
    text: () => Promise.resolve(JSON.stringify({ error: message })),
  });
}

export function mockFetchNetworkError() {
  return vi.fn().mockRejectedValue(new Error('Network error'));
}

// ============================================
// Wait Utilities
// ============================================

export function waitFor(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
