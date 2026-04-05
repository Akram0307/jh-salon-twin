/**
 * SalonOS Error Handler Utility
 * Handles error logging, toast notifications, and user-friendly messages
 */

import { error as toastError, success as toastSuccess, warning as toastWarning, info as toastInfo } from '@/components/ui/toast-system';
import { ApiError } from '@/types/api';

// ============================================
// Error Code to User-Friendly Message Mapping
// ============================================

const ERROR_MESSAGES: Record<string, string> = {
  // Network errors
  'NETWORK_ERROR': 'Unable to connect to the server. Please check your internet connection.',
  'TIMEOUT': 'The request took too long to complete. Please try again.',
  'OFFLINE': 'You are currently offline. Please check your internet connection.',
  
  // Authentication errors
  'UNAUTHORIZED': 'Your session has expired. Please log in again.',
  'FORBIDDEN': 'You do not have permission to perform this action.',
  'TOKEN_EXPIRED': 'Your session has expired. Please log in again.',
  
  // Validation errors
  'VALIDATION_ERROR': 'Please check your input and try again.',
  'REQUIRED_FIELD': 'Please fill in all required fields.',
  'INVALID_FORMAT': 'Please check the format of your input.',
  
  // Server errors
  'SERVER_ERROR': 'Something went wrong on our end. Please try again later.',
  'SERVICE_UNAVAILABLE': 'The service is temporarily unavailable. Please try again later.',
  'DATABASE_ERROR': 'We encountered a database error. Please try again later.',
  
  // Business logic errors
  'NOT_FOUND': 'The requested resource was not found.',
  'CONFLICT': 'This action conflicts with existing data.',
  'DUPLICATE_ENTRY': 'This entry already exists.',
  
  // Default
  'UNKNOWN': 'An unexpected error occurred. Please try again.',
};

// ============================================
// Error Logging
// ============================================

interface ErrorLogEntry {
  message: string;
  code?: string;
  status?: number;
  stack?: string;
  url?: string;
  timestamp: string;
  userAgent?: string;
  userId?: string;
  salonId?: string;
}

let errorLogQueue: ErrorLogEntry[] = [];
let isLogging = false;

/**
 * Log error to backend
 */
export async function logErrorToBackend(error: Error | ApiError, context?: Record<string, unknown>): Promise<void> {
  if (typeof window === 'undefined') return;
  
  const errorEntry: ErrorLogEntry = {
    message: error.message,
    code: error instanceof ApiError ? error.code : undefined,
    status: error instanceof ApiError ? error.status : undefined,
    stack: error.stack,
    url: window.location.href,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    ...context,
  };
  
  errorLogQueue.push(errorEntry);
  
  // Debounce logging to avoid too many requests
  if (!isLogging) {
    isLogging = true;
    setTimeout(async () => {
      await flushErrorLogs();
      isLogging = false;
    }, 5000);
  }
}

/**
 * Flush error logs to backend
 */
async function flushErrorLogs(): Promise<void> {
  if (errorLogQueue.length === 0) return;
  
  const logsToSend = [...errorLogQueue];
  errorLogQueue = [];
  
  try {
    // Send logs to backend endpoint
    await fetch('/api/logs/error', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ errors: logsToSend }),
    });
  } catch (err) {
    // Silently fail - we don't want to cause infinite loops
    console.error('Failed to send error logs:', err);
  }
}

// ============================================
// User-Friendly Error Messages
// ============================================

/**
 * Get user-friendly error message
 */
export function getUserFriendlyMessage(error: Error | ApiError | unknown): string {
  if (error instanceof ApiError) {
    // Try to get message from error code
    if (error.code && ERROR_MESSAGES[error.code]) {
      return ERROR_MESSAGES[error.code];
    }
    
    // Try to get message from status code
    if (error.status) {
      switch (error.status) {
        case 400:
          return ERROR_MESSAGES['VALIDATION_ERROR'];
        case 401:
          return ERROR_MESSAGES['UNAUTHORIZED'];
        case 403:
          return ERROR_MESSAGES['FORBIDDEN'];
        case 404:
          return ERROR_MESSAGES['NOT_FOUND'];
        case 409:
          return ERROR_MESSAGES['CONFLICT'];
        case 422:
          return ERROR_MESSAGES['VALIDATION_ERROR'];
        case 500:
          return ERROR_MESSAGES['SERVER_ERROR'];
        case 503:
          return ERROR_MESSAGES['SERVICE_UNAVAILABLE'];
        default:
          return error.message || ERROR_MESSAGES['UNKNOWN'];
      }
    }
    
    return error.message || ERROR_MESSAGES['UNKNOWN'];
  }
  
  if (error instanceof Error) {
    // Check for network errors
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      return ERROR_MESSAGES['NETWORK_ERROR'];
    }
    
    if (error.message.includes('timeout') || error.message.includes('Timeout')) {
      return ERROR_MESSAGES['TIMEOUT'];
    }
    
    return error.message || ERROR_MESSAGES['UNKNOWN'];
  }
  
  return ERROR_MESSAGES['UNKNOWN'];
}

// ============================================
// Toast Notifications for Errors
// ============================================

/**
 * Show error toast notification
 */
export function showErrorToast(error: Error | ApiError | unknown, title?: string): void {
  if (typeof window === 'undefined') return;
  
  const message = getUserFriendlyMessage(error);
  toastError(message, title || 'Error');
  
  // Also log the error
  if (error instanceof Error || error instanceof ApiError) {
    logErrorToBackend(error);
  }
}

/**
 * Show success toast notification
 */
export function showSuccessToast(message: string, title?: string): void {
  if (typeof window === 'undefined') return;
  toastSuccess(message, title || 'Success');
}

/**
 * Show warning toast notification
 */
export function showWarningToast(message: string, title?: string): void {
  if (typeof window === 'undefined') return;
  toastWarning(message, title || 'Warning');
}

/**
 * Show info toast notification
 */
export function showInfoToast(message: string, title?: string): void {
  if (typeof window === 'undefined') return;
  toastInfo(message, title || 'Info');
}

// ============================================
// Error Handling for API Responses
// ============================================

/**
 * Handle API error with toast notification
 */
export function handleApiError(error: unknown, showToast: boolean = true): void {
  if (showToast) {
    showErrorToast(error);
  }
  
  // Log the error
  if (error instanceof Error || error instanceof ApiError) {
    logErrorToBackend(error);
  }
}

/**
 * Wrap an async function with error handling
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: { showToast?: boolean; rethrow?: boolean } = {}
): T {
  const { showToast = true, rethrow = false } = options;
  
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      handleApiError(error, showToast);
      
      if (rethrow) {
        throw error;
      }
      
      return undefined;
    }
  }) as T;
}

// ============================================
// Error Boundary Helpers
// ============================================

/**
 * Create error boundary fallback props
 */
export function createErrorBoundaryProps(
  error: Error,
  resetError: () => void
) {
  return {
    error,
    resetError,
    title: 'Something went wrong',
    message: getUserFriendlyMessage(error),
    action: {
      label: 'Try again',
      onClick: resetError,
    },
  };
}

// ============================================
// Offline Detection
// ============================================

let isOffline = false;

/**
 * Set up offline detection
 */
export function setupOfflineDetection(): void {
  if (typeof window === 'undefined') return;

  const handleOnline = () => {
    if (isOffline) {
      isOffline = false;
      showSuccessToast('You are back online', 'Connection Restored');
    }
  };

  const handleOffline = () => {
    isOffline = true;
    showWarningToast('You are currently offline. Some features may be unavailable.', 'Connection Lost');
  };

  // Check initial state
  if (!navigator.onLine) {
    isOffline = true;
    showWarningToast('You are currently offline. Some features may be unavailable.', 'Connection Lost');
  }

  // Add event listeners
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
}

/**
 * Check if currently offline
 */
export function isCurrentlyOffline(): boolean {
  return isOffline;
}
