/**
 * Auth Flow Integration Tests
 * Tests login/logout flow with AuthContext
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// Mock the API client with all exports - define mocks inside factory
vi.mock('@/lib/api-client', () => {
  return {
    apiClient: {
      post: vi.fn(),
      get: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    },
    getAuthToken: vi.fn(),
    setAuthToken: vi.fn(),
    clearAuthToken: vi.fn(),
    isAuthenticated: vi.fn(),
    ApiError: class ApiError extends Error {
      status: number;
      constructor(message: string, status: number) {
        super(message);
        this.status = status;
      }
    },
  };
});

// Get the mocked functions after the mock is set up
import { apiClient, getAuthToken, setAuthToken, clearAuthToken, isAuthenticated } from '@/lib/api-client';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

// Test component that uses auth - matches actual AuthContext API
function TestComponent() {
  const { user, isAuthenticated: authStatus, login, logout, isLoading } = useAuth();
  
  const handleLogin = () => {
    // login expects LoginCredentials object { email, password }
    login({ email: 'test@example.com', password: 'password' });
  };
  
  return (
    <div>
      <div data-testid="auth-status">
        {isLoading ? 'Loading' : authStatus ? 'Authenticated' : 'Not authenticated'}
      </div>
      {user && <div data-testid="user-email">{user.email}</div>}
      <button onClick={handleLogin} data-testid="login-btn">
        Login
      </button>
      <button onClick={logout} data-testid="logout-btn">
        Logout
      </button>
    </div>
  );
}

describe('Auth Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    (getAuthToken as ReturnType<typeof vi.fn>).mockReturnValue(null);
    (isAuthenticated as ReturnType<typeof vi.fn>).mockReturnValue(false);
  });

  it('should start with unauthenticated state when no token', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).not.toHaveTextContent('Loading');
    });
    
    expect(screen.getByTestId('auth-status')).toHaveTextContent('Not authenticated');
  });

  it('should handle successful login', async () => {
    const user = userEvent.setup();
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      role: 'owner' as const,
      salonId: 'salon-456',
    };
    
    // Mock successful login response
    (apiClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: mockUser,
      token: 'mock-token',
    });
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Wait for initial loading to complete
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).not.toHaveTextContent('Loading');
    });
    
    // Click login button
    await user.click(screen.getByTestId('login-btn'));
    
    // Wait for authentication to complete
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
    });
    
    // Verify user email is displayed
    expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com');
    
    // Verify API was called correctly with LoginCredentials object
    expect(apiClient.post).toHaveBeenCalledWith('/api/auth/login', {
      email: 'test@example.com',
      password: 'password',
    });
  });

  it('should handle logout', async () => {
    const user = userEvent.setup();
    
    // Mock initial authenticated state
    localStorage.setItem('salonos_auth_token', 'mock-token');
    localStorage.setItem('salonos_auth_user', JSON.stringify({
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      role: 'owner',
      salonId: 'salon-456',
    }));
    (getAuthToken as ReturnType<typeof vi.fn>).mockReturnValue('mock-token');
    (isAuthenticated as ReturnType<typeof vi.fn>).mockReturnValue(true);
    
    // Mock the /auth/me call for token validation
    (apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      role: 'owner',
      salonId: 'salon-456',
    });
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Wait for initial loading to complete
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).not.toHaveTextContent('Loading');
    });
    
    // Should start authenticated
    expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
    
    // Click logout button
    await user.click(screen.getByTestId('logout-btn'));
    
    // Should become unauthenticated
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Not authenticated');
    });
    
    // Verify clearAuthToken was called
    expect(clearAuthToken).toHaveBeenCalled();
  });

  it('should call setAuthToken on successful login', async () => {
    const user = userEvent.setup();
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      role: 'owner' as const,
      salonId: 'salon-456',
    };
    
    (apiClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: mockUser,
      token: 'new-token',
    });
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).not.toHaveTextContent('Loading');
    });
    
    await user.click(screen.getByTestId('login-btn'));
    
    await waitFor(() => {
      expect(setAuthToken).toHaveBeenCalledWith('new-token');
    });
  });

  it('should have login and logout functions available', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).not.toHaveTextContent('Loading');
    });
    
    // Verify buttons are rendered (functions are available)
    expect(screen.getByTestId('login-btn')).toBeInTheDocument();
    expect(screen.getByTestId('logout-btn')).toBeInTheDocument();
  });
});
