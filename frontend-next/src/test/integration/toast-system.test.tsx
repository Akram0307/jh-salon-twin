/**
 * Toast System Integration Tests
 * Tests toast notification system functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { toast, success, error, warning, info } from '@/components/ui/toast-system';

describe('Toast System Integration', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  describe('Toast function', () => {
    it('should create a toast with title and description', () => {
      const result = toast({
        title: 'Test Title',
        description: 'Test description',
        variant: 'default',
      });

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('dismiss');
      expect(result).toHaveProperty('update');
      expect(typeof result.id).toBe('string');
      expect(typeof result.dismiss).toBe('function');
      expect(typeof result.update).toBe('function');
    });

    it('should generate unique IDs for each toast', () => {
      const toast1 = toast({ title: 'Toast 1', variant: 'default' });
      const toast2 = toast({ title: 'Toast 2', variant: 'default' });

      expect(toast1.id).not.toBe(toast2.id);
    });
  });

  describe('Success helper', () => {
    it('should create a success toast with message', () => {
      const result = success('Operation completed');

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('dismiss');
      expect(typeof result.id).toBe('string');
    });

    it('should create a success toast with custom title', () => {
      const result = success('Operation completed', 'Custom Success');

      expect(result).toHaveProperty('id');
      expect(typeof result.id).toBe('string');
    });
  });

  describe('Error helper', () => {
    it('should create an error toast with message', () => {
      const result = error('Something went wrong');

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('dismiss');
      expect(typeof result.id).toBe('string');
    });

    it('should create an error toast with custom title', () => {
      const result = error('Something went wrong', 'Custom Error');

      expect(result).toHaveProperty('id');
      expect(typeof result.id).toBe('string');
    });
  });

  describe('Warning helper', () => {
    it('should create a warning toast with message', () => {
      const result = warning('Please be careful');

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('dismiss');
      expect(typeof result.id).toBe('string');
    });

    it('should create a warning toast with custom title', () => {
      const result = warning('Please be careful', 'Custom Warning');

      expect(result).toHaveProperty('id');
      expect(typeof result.id).toBe('string');
    });
  });

  describe('Info helper', () => {
    it('should create an info toast with message', () => {
      const result = info('Just so you know');

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('dismiss');
      expect(typeof result.id).toBe('string');
    });

    it('should create an info toast with custom title', () => {
      const result = info('Just so you know', 'Custom Info');

      expect(result).toHaveProperty('id');
      expect(typeof result.id).toBe('string');
    });
  });

  describe('Toast dismissal', () => {
    it('should dismiss a toast programmatically', () => {
      const result = toast({
        title: 'Dismissible',
        description: 'Click to dismiss',
        variant: 'default',
      });

      // Should not throw when dismissing
      expect(() => result.dismiss()).not.toThrow();
    });
  });

  describe('Toast update', () => {
    it('should update a toast', () => {
      const result = toast({
        title: 'Original',
        description: 'Original description',
        variant: 'default',
      });

      // Should not throw when updating
      expect(() => result.update({
        id: result.id,
        title: 'Updated',
        description: 'Updated description',
      })).not.toThrow();
    });
  });

  describe('Multiple toasts', () => {
    it('should handle multiple toasts being created', () => {
      const results = [
        success('Toast 1'),
        error('Toast 2'),
        warning('Toast 3'),
        info('Toast 4'),
      ];

      // All should have unique IDs
      const ids = results.map(r => r.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);

      // All should have dismiss functions
      results.forEach(r => {
        expect(typeof r.dismiss).toBe('function');
      });
    });
  });
});
