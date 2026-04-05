import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotificationLogRepository } from '../../repositories/NotificationLogRepository';

// Mock the db module
vi.mock('../../config/db', () => ({
  query: vi.fn(),
}));

import { query } from '../../config/db';
const mockQuery = vi.mocked(query);

describe('NotificationLogRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('findBySalonId', () => {
    it('should find logs by salon id', async () => {
      const mockRows = [{ id: '1', salon_id: 'salon-123', type: 'sms' }];
      mockQuery.mockResolvedValue({ rows: mockRows });

      const result = await NotificationLogRepository.findBySalonId('salon-123');

      expect(result).toEqual(mockRows);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE salon_id = $1'),
        expect.arrayContaining(['salon-123'])
      );
    });

    it('should filter by type when provided', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      await NotificationLogRepository.findBySalonId('salon-123', 50, 0, 'sms');

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('type = $2'),
        expect.arrayContaining(['sms'])
      );
    });

    it('should filter by status when provided', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      await NotificationLogRepository.findBySalonId('salon-123', 50, 0, undefined, 'sent');

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('status = $'),
        expect.arrayContaining(['sent'])
      );
    });

    it('should filter by both type and status', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      await NotificationLogRepository.findBySalonId('salon-123', 50, 0, 'email', 'failed');

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('type = $2'),
        expect.arrayContaining(['email', 'failed'])
      );
    });
  });

  describe('findById', () => {
    it('should find log by id', async () => {
      const mockLog = { id: 'log-123', salon_id: 'salon-123' };
      mockQuery.mockResolvedValue({ rows: [mockLog] });

      const result = await NotificationLogRepository.findById('log-123');

      expect(result).toEqual(mockLog);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE id = $1'),
        ['log-123']
      );
    });

    it('should return null when log not found', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const result = await NotificationLogRepository.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new log entry', async () => {
      const mockLog = {
        id: 'new-log-123',
        salon_id: 'salon-123',
        type: 'sms',
        recipient: '+1234567890',
        content: 'Test message',
        status: 'pending',
      };
      mockQuery.mockResolvedValue({ rows: [mockLog] });

      const result = await NotificationLogRepository.create({
        salon_id: 'salon-123',
        type: 'sms',
        recipient: '+1234567890',
        content: 'Test message',
      });

      expect(result).toEqual(mockLog);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO notification_logs'),
        expect.arrayContaining(['salon-123', null, null, null, 'sms', '+1234567890', 'Test message', 'pending', null, null])
      );
    });

    it('should create log with all optional fields', async () => {
      const mockLog = {
        id: 'new-log-456',
        salon_id: 'salon-123',
        user_id: 'user-456',
        user_type: 'client',
        template_id: 'template-789',
        type: 'email',
        recipient: 'test@example.com',
        content: 'Email content',
        status: 'sent',
        error_message: null,
        sent_at: new Date(),
      };
      mockQuery.mockResolvedValue({ rows: [mockLog] });

      const result = await NotificationLogRepository.create({
        salon_id: 'salon-123',
        user_id: 'user-456',
        user_type: 'client',
        template_id: 'template-789',
        type: 'email',
        recipient: 'test@example.com',
        content: 'Email content',
        status: 'sent',
      });

      expect(result).toEqual(mockLog);
    });
  });

  describe('updateStatus', () => {
    it('should update status only', async () => {
      const mockLog = { id: 'log-123', status: 'sent' };
      mockQuery.mockResolvedValue({ rows: [mockLog] });

      const result = await NotificationLogRepository.updateStatus('log-123', 'sent');

      expect(result).toEqual(mockLog);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('status = $1'),
        expect.arrayContaining(['sent', 'log-123'])
      );
    });

    it('should update status with error message', async () => {
      const mockLog = { id: 'log-123', status: 'failed', error_message: 'Send failed' };
      mockQuery.mockResolvedValue({ rows: [mockLog] });

      const result = await NotificationLogRepository.updateStatus('log-123', 'failed', 'Send failed');

      expect(result).toEqual(mockLog);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('error_message'),
        expect.arrayContaining(['failed', 'Send failed', 'log-123'])
      );
    });

    it('should update status with sent_at', async () => {
      const now = new Date();
      const mockLog = { id: 'log-123', status: 'sent', sent_at: now };
      mockQuery.mockResolvedValue({ rows: [mockLog] });

      const result = await NotificationLogRepository.updateStatus('log-123', 'sent', undefined, now);

      expect(result).toEqual(mockLog);
    });

    it('should return null when log not found', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const result = await NotificationLogRepository.updateStatus('non-existent', 'sent');

      expect(result).toBeNull();
    });
  });

  describe('markAsSent', () => {
    it('should mark log as sent with timestamp', async () => {
      const mockLog = { id: 'log-123', status: 'sent' };
      mockQuery.mockResolvedValue({ rows: [mockLog] });

      const result = await NotificationLogRepository.markAsSent('log-123');

      expect(result).toEqual(mockLog);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('status = $1'),
        expect.arrayContaining(['sent'])
      );
    });
  });

  describe('markAsFailed', () => {
    it('should mark log as failed with error message', async () => {
      const mockLog = { id: 'log-123', status: 'failed', error_message: 'Connection timeout' };
      mockQuery.mockResolvedValue({ rows: [mockLog] });

      const result = await NotificationLogRepository.markAsFailed('log-123', 'Connection timeout');

      expect(result).toEqual(mockLog);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('status = $1'),
        expect.arrayContaining(['failed', 'Connection timeout', 'log-123'])
      );
    });
  });

  describe('getStats', () => {
    it('should return stats for salon', async () => {
      const mockDaily = [{ type: 'sms', status: 'sent', count: '10', date: '2024-01-15' }];
      const mockSummary = { total: '100', sent: '80', failed: '15', pending: '5' };
      const mockByType = [{ type: 'sms', count: '60' }, { type: 'email', count: '40' }];

      mockQuery
        .mockResolvedValueOnce({ rows: mockDaily })
        .mockResolvedValueOnce({ rows: [mockSummary] })
        .mockResolvedValueOnce({ rows: mockByType });

      const result = await NotificationLogRepository.getStats('salon-123', 30);

      expect(result.daily).toEqual(mockDaily);
      expect(result.summary).toEqual(mockSummary);
      expect(result.byType).toEqual(mockByType);
    });

    it('should use default days of 30', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      await NotificationLogRepository.getStats('salon-123');

      expect(mockQuery).toHaveBeenCalledTimes(3);
    });

    it('should use custom days parameter', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      await NotificationLogRepository.getStats('salon-123', 7);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('7 days'),
        expect.any(Array)
      );
    });
  });
});
