/**
 * SalonOS Typed API Client
 * Type-safe fetch wrapper with auth, error handling, and retry logic
 */

import { API_CONFIG } from './api-endpoints';
import type { ApiResponse, ApiError as ApiErrorType, PaginationMeta } from '@/types/api';
import { ApiError } from '@/types/api';
import { showErrorToast } from './error-handler';

// ============================================
// Types
// ============================================

export interface RequestConfig extends Omit<RequestInit, 'body'> {
  params?: Record<string, string | number | boolean | undefined | null>;
  timeout?: number;
  retries?: number;
  skipAuth?: boolean;
  body?: unknown;
  skipErrorToast?: boolean; // New option to skip error toast
}

export interface ApiClientConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
  getToken: () => string | null;
  onUnauthorized?: () => void;
}

// ============================================
// Token Management
// ============================================

const TOKEN_KEY = 'salonos_auth_token';
const REFRESH_TOKEN_KEY = 'salonos_refresh_token';
const AUTH_COOKIE_NAME = 'salonos_auth_token';

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
  // Also set cookie for Next.js middleware
  document.cookie = `${AUTH_COOKIE_NAME}=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
}

export function clearAuthToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  // Also clear cookie for Next.js middleware
  document.cookie = `${AUTH_COOKIE_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

export function isAuthenticated(): boolean {
  return !!getAuthToken();
}

// ============================================
// URL Building
// ============================================

function buildUrl(
  path: string,
  params?: Record<string, string | number | boolean | undefined | null>
): string {
  const baseUrl = API_CONFIG.baseUrl.replace(/\/$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${baseUrl}${normalizedPath}`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  return url.toString();
}

// ============================================
// Error Handling
// ============================================

async function handleResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type');
  const isJson = contentType?.includes('application/json');

  if (!response.ok) {
    let errorBody: unknown;
    try {
      errorBody = isJson ? await response.json() : await response.text();
    } catch {
      errorBody = null;
    }

    throw ApiError.fromResponse(response, errorBody);
  }

  // Handle non-JSON responses gracefully
  if (!isJson) {
    const text = await response.text();
    // Return empty object for 204 No Content
    if (response.status === 204) {
      return {} as T;
    }
    // Try to parse as JSON anyway (some servers don't set content-type correctly)
    try {
      return JSON.parse(text) as T;
    } catch {
      return text as unknown as T;
    }
  }

  return response.json() as Promise<T>;
}

// ============================================
// Retry Logic
// ============================================

async function withRetry<T>(
  fn: () => Promise<T>,
  retries: number,
  delay = 1000
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;

    // Only retry on network errors or 5xx server errors
    if (error instanceof ApiError && error.status < 500) {
      throw error;
    }

    await new Promise(resolve => setTimeout(resolve, delay));
    return withRetry(fn, retries - 1, delay * 2);
  }
}

// ============================================
// Core Request Function
// ============================================

async function request<T>(
  method: string,
  path: string,
  config: RequestConfig = {}
): Promise<T> {
  const {
    params,
    timeout = API_CONFIG.timeout,
    retries = API_CONFIG.retries,
    skipAuth = false,
    skipErrorToast = false,
    body,
    headers: customHeaders,
    ...restConfig
  } = config;

  const url = buildUrl(path, params);
  const token = skipAuth ? null : getAuthToken();

  const headers: HeadersInit = {
    'Accept': 'application/json',
    ...(body !== undefined && { 'Content-Type': 'application/json' }),
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...customHeaders,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  const executeRequest = async (): Promise<T> => {
    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
        cache: 'no-store',
        ...restConfig,
      });

      return handleResponse<T>(response);
    } finally {
      clearTimeout(timeoutId);
    }
  };

  try {
    return await withRetry(executeRequest, retries);
  } catch (error) {
    // Show error toast for 5xx errors and network errors, unless skipped
    if (!skipErrorToast) {
      if (error instanceof ApiError) {
        if (error.status >= 500) {
          showErrorToast(error);
        }
      } else {
        // Network error or other non-HTTP error
        showErrorToast(error);
      }
    }
    throw error;
  }
}

// ============================================
// HTTP Method Functions
// ============================================

export async function get<T>(
  path: string,
  config?: RequestConfig
): Promise<T> {
  return request<T>('GET', path, config);
}

export async function post<T>(
  path: string,
  body?: unknown,
  config?: RequestConfig
): Promise<T> {
  return request<T>('POST', path, { ...config, body });
}

export async function put<T>(
  path: string,
  body?: unknown,
  config?: RequestConfig
): Promise<T> {
  return request<T>('PUT', path, { ...config, body });
}

export async function patch<T>(
  path: string,
  body?: unknown,
  config?: RequestConfig
): Promise<T> {
  return request<T>('PATCH', path, { ...config, body });
}

export async function del<T>(
  path: string,
  config?: RequestConfig
): Promise<T> {
  return request<T>('DELETE', path, config);
}

// ============================================
// Typed API Client Class
// ============================================

export class ApiClient {
  private baseUrl: string;
  private timeout: number;
  private retries: number;

  constructor(config?: Partial<ApiClientConfig>) {
    this.baseUrl = config?.baseUrl || API_CONFIG.baseUrl;
    this.timeout = config?.timeout || API_CONFIG.timeout;
    this.retries = config?.retries || API_CONFIG.retries;
  }

  async get<T>(path: string, config?: RequestConfig): Promise<T> {
    return get<T>(path, { timeout: this.timeout, retries: this.retries, ...config });
  }

  async post<T>(path: string, body?: unknown, config?: RequestConfig): Promise<T> {
    return post<T>(path, body, { timeout: this.timeout, retries: this.retries, ...config });
  }

  async put<T>(path: string, body?: unknown, config?: RequestConfig): Promise<T> {
    return put<T>(path, body, { timeout: this.timeout, retries: this.retries, ...config });
  }

  async patch<T>(path: string, body?: unknown, config?: RequestConfig): Promise<T> {
    return patch<T>(path, body, { timeout: this.timeout, retries: this.retries, ...config });
  }

  async delete<T>(path: string, config?: RequestConfig): Promise<T> {
    return del<T>(path, { timeout: this.timeout, retries: this.retries, ...config });
  }
}

// ============================================
// Default Export
// ============================================

export const apiClient = new ApiClient();

export default apiClient;
