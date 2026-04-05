'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { apiClient, setAuthToken, clearAuthToken, getAuthToken } from '@/lib/api-client';
import { AUTH_ENDPOINTS } from '@/lib/api-endpoints';
import type { User } from '@/types/api';

// ============================================
// Types
// ============================================

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
  hasRole: (role: User['role'] | User['role'][]) => boolean;
}

// ============================================
// Context
// ============================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================
// Provider
// ============================================

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // ============================================
  // Initialize auth state on mount
  // ============================================

  useEffect(() => {
    const initAuth = async () => {
      const token = getAuthToken();
      
      if (token) {
        try {
          // Fetch current user with existing token
          const user = await apiClient.get<User>(AUTH_ENDPOINTS.me);
          setState({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          // Token is invalid or expired
          clearAuthToken();
          setState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };

    initAuth();
  }, []);

  // ============================================
  // Login
  // ============================================

  const login = useCallback(async (credentials: LoginCredentials) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await apiClient.post<AuthResponse>(AUTH_ENDPOINTS.login, credentials);
      
      // Store token
      setAuthToken(response.token);
      
      setState({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, []);

  // ============================================
  // Logout
  // ============================================

  const logout = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      // Attempt to notify backend
      await apiClient.post(AUTH_ENDPOINTS.logout);
    } catch (error) {
      // Ignore logout errors - clear local state anyway
      console.warn('Logout API call failed, clearing local state');
    } finally {
      clearAuthToken();
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  }, []);

  // ============================================
  // Refresh User
  // ============================================

  const refreshUser = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const user = await apiClient.get<User>(AUTH_ENDPOINTS.me);
      setState(prev => ({
        ...prev,
        user,
        isAuthenticated: true,
      }));
    } catch (error) {
      // Token is invalid
      clearAuthToken();
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  }, []);

  // ============================================
  // Clear Error
  // ============================================

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // ============================================
  // Role Check
  // ============================================

  const hasRole = useCallback((role: User['role'] | User['role'][]): boolean => {
    if (!state.user) return false;
    
    if (Array.isArray(role)) {
      return role.includes(state.user.role);
    }
    
    return state.user.role === role;
  }, [state.user]);

  // ============================================
  // Context Value
  // ============================================

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    refreshUser,
    clearError,
    hasRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ============================================
// Hook
// ============================================

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

// ============================================
// HOC for protected components
// ============================================

export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  requiredRole?: User['role'] | User['role'][]
) {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, isLoading, hasRole } = useAuth();

    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return null; // Middleware will redirect
    }

    if (requiredRole && !hasRole(requiredRole)) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
            <p className="text-muted-foreground mt-2">You don't have permission to view this page.</p>
          </div>
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };
}

export default AuthContext;
