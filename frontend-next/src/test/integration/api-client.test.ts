/**
 * API Client Integration Tests
 * Tests API client methods, error handling, and retry logic
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApiError } from '@/types/api';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

// Import api-client after mocking
import { apiClient, getAuthToken, setAuthToken, clearAuthToken, isAuthenticated } from '@/lib/api-client';

describe('API Client Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Token Management', () => {
    it('should get auth token from localStorage', () => {
      localStorageMock.getItem.mockReturnValue('test-token');
      const token = getAuthToken();
      expect(localStorageMock.getItem).toHaveBeenCalledWith('salonos_auth_token');
    });

    it('should set auth token in localStorage', () => {
      setAuthToken('new-token');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('salonos_auth_token', 'new-token');
    });

    it('should clear auth tokens from localStorage', () => {
      clearAuthToken();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('salonos_auth_token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('salonos_refresh_token');
    });

    it('should check if authenticated', () => {
      localStorageMock.getItem.mockReturnValue('test-token');
      expect(isAuthenticated()).toBe(true);
      
      localStorageMock.getItem.mockReturnValue(null);
      expect(isAuthenticated()).toBe(false);
    });
  });

  describe('GET requests', () => {
    it('should make successful GET request', async () => {
      const mockData = { id: '1', name: 'Test' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve(mockData),
      });

      const result = await apiClient.get('/test');

      expect(mockFetch).toHaveBeenCalled();
      expect(result).toEqual(mockData);
    });

    it('should include auth token in headers when available', async () => {
      localStorageMock.getItem.mockReturnValue('test-token-123');
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({}),
      });

      await apiClient.get('/protected');

      expect(mockFetch).toHaveBeenCalled();
      const callArgs = mockFetch.mock.calls[0];
      // The headers are a Headers object, so we can use .get()
      expect(callArgs[1].headers['Authorization']).toBe('Bearer test-token-123');
    });
  });

  describe('POST requests', () => {
    it('should make successful POST request with body', async () => {
      const requestBody = { name: 'New Item', value: 42 };
      const mockResponse = { id: '2', ...requestBody };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve(mockResponse),
      });

      const result = await apiClient.post('/items', requestBody);

      expect(mockFetch).toHaveBeenCalled();
      const callArgs = mockFetch.mock.calls[0];
      expect(callArgs[1].method).toBe('POST');
      expect(callArgs[1].body).toBe(JSON.stringify(requestBody));
      expect(result).toEqual(mockResponse);
    });
  });

  describe('PUT requests', () => {
    it('should make successful PUT request', async () => {
      const updateData = { name: 'Updated Item' };
      const mockResponse = { id: '1', ...updateData };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve(mockResponse),
      });

      const result = await apiClient.put('/items/1', updateData);

      expect(mockFetch).toHaveBeenCalled();
      const callArgs = mockFetch.mock.calls[0];
      expect(callArgs[1].method).toBe('PUT');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('DELETE requests', () => {
    it('should make successful DELETE request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        headers: new Headers({}),
        text: () => Promise.resolve(''),
      });

      await apiClient.delete('/items/1');

      expect(mockFetch).toHaveBeenCalled();
      const callArgs = mockFetch.mock.calls[0];
      expect(callArgs[1].method).toBe('DELETE');
    });
  });

  describe('Error handling', () => {
    it('should throw ApiError for 4xx responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({ error: 'Bad request', message: 'Invalid input' }),
      });

      await expect(apiClient.get('/bad-request')).rejects.toThrow(ApiError);
    });

    it('should throw ApiError for 5xx responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({ error: 'Internal server error' }),
      });

      await expect(apiClient.get('/server-error', { retries: 0 })).rejects.toThrow(ApiError);
    });

    it('should include status code in ApiError', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({ error: 'Not found' }),
      });

      try {
        await apiClient.get('/not-found');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(404);
      }
    });
  });

  describe('Query parameters', () => {
    it('should append query parameters to URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve([]),
      });

      await apiClient.get('/search', { params: { q: 'test', limit: 10 } });

      expect(mockFetch).toHaveBeenCalled();
      const url = mockFetch.mock.calls[0][0];
      expect(url).toContain('q=test');
      expect(url).toContain('limit=10');
    });
  });
});
