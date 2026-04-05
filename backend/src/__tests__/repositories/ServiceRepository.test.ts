import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ServiceRepository, ServiceConflictError } from '../../repositories/ServiceRepository';

// Mock the db module
vi.mock('../../config/db', () => ({
  query: vi.fn(),
}));

import { query } from '../../config/db';
const mockQuery = vi.mocked(query);

describe('ServiceRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('normalizeServiceName', () => {
    it('should convert to lowercase', () => {
      expect(ServiceRepository.normalizeServiceName('HAIRCUT')).toBe('haircut');
    });

    it('should remove apostrophes', () => {
      expect(ServiceRepository.normalizeServiceName("Men's Haircut")).toBe('mens haircut');
    });

    it('should remove special characters', () => {
      expect(ServiceRepository.normalizeServiceName('Haircut & Style!')).toBe('haircut style');
    });

    it('should collapse multiple spaces', () => {
      expect(ServiceRepository.normalizeServiceName('Hair   Cut')).toBe('hair cut');
    });

    it('should trim whitespace', () => {
      expect(ServiceRepository.normalizeServiceName('  Haircut  ')).toBe('haircut');
    });
  });

  describe('hasColumn', () => {
    it('should return true if column exists', async () => {
      mockQuery.mockResolvedValue({ rows: [{ column_name: 'updated_at' }] });
      const result = await ServiceRepository.hasColumn('updated_at');
      expect(result).toBe(true);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('information_schema.columns'),
        ['updated_at']
      );
    });

    it('should return false if column does not exist', async () => {
      mockQuery.mockResolvedValue({ rows: [] });
      const result = await ServiceRepository.hasColumn('nonexistent_column');
      expect(result).toBe(false);
    });
  });

  describe('findAll', () => {
    it('should return all services for a salon', async () => {
      const mockServices = [
        { id: '1', name: 'Haircut', category: 'Hair' },
        { id: '2', name: 'Manicure', category: 'Nails' },
      ];
      mockQuery.mockResolvedValue({ rows: mockServices });

      const result = await ServiceRepository.findAll('salon-123');

      expect(result).toEqual(mockServices);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE salon_id = $1'),
        ['salon-123']
      );
    });

    it('should use default salon ID when not provided', async () => {
      mockQuery.mockResolvedValue({ rows: [] });
      await ServiceRepository.findAll();
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE salon_id = $1'),
        expect.arrayContaining([expect.any(String)])
      );
    });
  });

  describe('findById', () => {
    it('should find service by id and salon id', async () => {
      const mockService = { id: 'service-123', salon_id: 'salon-123', name: 'Haircut' };
      mockQuery.mockResolvedValue({ rows: [mockService] });

      const result = await ServiceRepository.findById('service-123', 'salon-123');

      expect(result).toEqual(mockService);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE id = $1 AND salon_id = $2'),
        ['service-123', 'salon-123']
      );
    });

    it('should return undefined when not found', async () => {
      mockQuery.mockResolvedValue({ rows: [] });
      const result = await ServiceRepository.findById('non-existent', 'salon-123');
      expect(result).toBeUndefined();
    });
  });

  describe('findByName', () => {
    it('should find service by normalized name', async () => {
      const mockService = { id: '1', name: "Men's Haircut" };
      mockQuery.mockResolvedValue({ rows: [mockService] });

      const result = await ServiceRepository.findByName("Men's Haircut", 'salon-123');

      expect(result).toEqual(mockService);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('regexp_replace'),
        expect.arrayContaining(['salon-123'])
      );
    });
  });

  describe('findActiveByName', () => {
    it('should find active service by name', async () => {
      const mockService = { id: '1', name: 'Haircut', is_active: true };
      mockQuery.mockResolvedValue({ rows: [mockService] });

      const result = await ServiceRepository.findActiveByName('Haircut', 'salon-123');

      expect(result).toEqual(mockService);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('is_active = true'),
        expect.any(Array)
      );
    });

    it('should exclude specific id when provided', async () => {
      mockQuery.mockResolvedValue({ rows: [] });
      await ServiceRepository.findActiveByName('Haircut', 'salon-123', 'exclude-id');
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('id <> $'),
        expect.arrayContaining(['exclude-id'])
      );
    });

    it('should return null when no active service found', async () => {
      mockQuery.mockResolvedValue({ rows: [] });
      const result = await ServiceRepository.findActiveByName('Nonexistent', 'salon-123');
      expect(result).toBeNull();
    });
  });

  describe('ensureNoActiveNameConflict', () => {
    it('should throw ServiceConflictError when duplicate found', async () => {
      const mockDuplicate = { id: '1', name: 'Haircut' };
      mockQuery.mockResolvedValue({ rows: [mockDuplicate] });

      await expect(
        ServiceRepository.ensureNoActiveNameConflict('Haircut', 'salon-123')
      ).rejects.toThrow(ServiceConflictError);
    });

    it('should not throw when no duplicate found', async () => {
      mockQuery.mockResolvedValue({ rows: [] });
      await expect(
        ServiceRepository.ensureNoActiveNameConflict('Unique Service', 'salon-123')
      ).resolves.not.toThrow();
    });
  });

  describe('create', () => {
    it('should create a new service', async () => {
      const mockService = {
        id: 'new-service',
        salon_id: 'salon-123',
        name: 'New Service',
        description: 'A new service',
        duration_minutes: 60,
        price: 50,
        category: 'Hair',
        is_active: true,
      };
      // First call is findActiveByName (no conflict), second is INSERT
      mockQuery
        .mockResolvedValueOnce({ rows: [] }) // findActiveByName - no conflict
        .mockResolvedValueOnce({ rows: [mockService] }); // INSERT

      const result = await ServiceRepository.create({
        salon_id: 'salon-123',
        name: 'New Service',
        description: 'A new service',
        duration_minutes: 60,
        price: 50,
        category: 'Hair',
      });

      expect(result).toEqual(mockService);
      expect(mockQuery).toHaveBeenCalledTimes(2);
    });

    it('should throw ServiceConflictError when duplicate name exists', async () => {
      const mockDuplicate = { id: 'existing', name: 'Existing Service' };
      mockQuery.mockResolvedValue({ rows: [mockDuplicate] });

      await expect(
        ServiceRepository.create({
          salon_id: 'salon-123',
          name: 'Existing Service',
          duration_minutes: 30,
          price: 25,
        })
      ).rejects.toThrow(ServiceConflictError);
    });
  });

  describe('update', () => {
    it('should update an existing service', async () => {
      const existingService = {
        id: 'service-123',
        salon_id: 'salon-123',
        name: 'Old Name',
        description: 'Old description',
        duration_minutes: 30,
        price: 25,
        category: 'Hair',
        is_active: true,
      };
      const updatedService = { ...existingService, name: 'New Name' };
      mockQuery
        .mockResolvedValueOnce({ rows: [existingService] }) // findById
        .mockResolvedValueOnce({ rows: [] }) // ensureNoActiveNameConflict (findActiveByName)
        .mockResolvedValueOnce({ rows: [{ column_name: 'updated_at' }] }) // hasColumn
        .mockResolvedValueOnce({ rows: [updatedService] }); // update

      const result = await ServiceRepository.update('service-123', { name: 'New Name' }, 'salon-123');

      expect(result).toEqual(updatedService);
    });

    it('should return null when service not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] }); // findById
      const result = await ServiceRepository.update('non-existent', { name: 'New Name' }, 'salon-123');
      expect(result).toBeNull();
    });

    it('should throw ServiceConflictError when updating to duplicate name', async () => {
      const existingService = {
        id: 'service-123',
        salon_id: 'salon-123',
        name: 'Old Name',
        is_active: true,
      };
      const duplicateService = { id: 'other-service', name: 'Duplicate Name' };
      mockQuery
        .mockResolvedValueOnce({ rows: [existingService] }) // findById
        .mockResolvedValueOnce({ rows: [duplicateService] }); // ensureNoActiveNameConflict (findActiveByName)

      await expect(
        ServiceRepository.update('service-123', { name: 'Duplicate Name' }, 'salon-123')
      ).rejects.toThrow(ServiceConflictError);
    });
  });
});
