import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../config/db', () => ({
  query: vi.fn(),
}));

import { query } from '../../config/db';
import { StaffRepository } from '../../repositories/StaffRepository';

describe('StaffRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all staff', async () => {
      const mockStaff = [
        { id: '1', full_name: 'John Doe', email: 'john@example.com' },
        { id: '2', full_name: 'Jane Smith', email: 'jane@example.com' },
      ];
      vi.mocked(query).mockResolvedValue({ rows: mockStaff });

      const result = await StaffRepository.findAll();

      expect(result).toEqual(mockStaff);
      expect(query).toHaveBeenCalled();
    });

    it('should throw error on database failure', async () => {
      vi.mocked(query).mockRejectedValue(new Error('Database error'));

      await expect(StaffRepository.findAll()).rejects.toThrow('Database error');
    });
  });

  describe('findById', () => {
    it('should return staff by id', async () => {
      const mockStaff = { id: '1', full_name: 'John Doe', email: 'john@example.com' };
      vi.mocked(query).mockResolvedValue({ rows: [mockStaff] });

      const result = await StaffRepository.findById('1');

      expect(result).toEqual(mockStaff);
    });

    it('should return undefined if not found', async () => {
      vi.mocked(query).mockResolvedValue({ rows: [] });

      const result = await StaffRepository.findById('999');

      expect(result).toBeUndefined();
    });

    it('should throw error on database failure', async () => {
      vi.mocked(query).mockRejectedValue(new Error('Database error'));

      await expect(StaffRepository.findById('1')).rejects.toThrow('Database error');
    });
  });

  describe('create', () => {
    it('should create a new staff member', async () => {
      const mockStaff = { id: '1', full_name: 'New Staff', email: 'new@example.com' };
      vi.mocked(query).mockResolvedValue({ rows: [mockStaff] });

      const result = await StaffRepository.create({
        full_name: 'New Staff',
        email: 'new@example.com',
      });

      expect(result).toEqual(mockStaff);
    });

    it('should throw error on database failure', async () => {
      vi.mocked(query).mockRejectedValue(new Error('Database error'));

      await expect(
        StaffRepository.create({ full_name: 'New Staff', email: 'new@example.com' })
      ).rejects.toThrow('Database error');
    });
  });

  describe('update', () => {
    it('should update staff member', async () => {
      const mockExisting = { id: '1', full_name: 'Old Name', email: 'old@example.com', phone_number: null, role: 'stylist', is_active: true };
      const mockUpdated = { id: '1', full_name: 'New Name', email: 'old@example.com', phone_number: null, role: 'stylist', is_active: true };
      
      // Mock the hasUpdatedAtColumn check
      const mockHasUpdatedAtColumn = vi.spyOn(StaffRepository, 'hasUpdatedAtColumn');
      mockHasUpdatedAtColumn.mockResolvedValue(false);
      
      vi.mocked(query)
        .mockResolvedValueOnce({ rows: [mockExisting] })  // findById
        .mockResolvedValueOnce({ rows: [mockUpdated] });  // update query

      const result = await StaffRepository.update('1', { full_name: 'New Name' });

      expect(result).toEqual(mockUpdated);
      expect(mockHasUpdatedAtColumn).toHaveBeenCalled();
    });

    it('should return null if staff not found', async () => {
      vi.mocked(query).mockResolvedValue({ rows: [] });

      const result = await StaffRepository.update('999', { full_name: 'New Name' });

      expect(result).toBeNull();
    });

    it('should throw error on database failure', async () => {
      const mockExisting = { id: '1', full_name: 'Old Name', email: 'old@example.com' };
      vi.mocked(query)
        .mockResolvedValueOnce({ rows: [mockExisting] })  // findById
        .mockRejectedValueOnce(new Error('Database error'));  // update query

      await expect(StaffRepository.update('1', { full_name: 'New Name' })).rejects.toThrow('Database error');
    });
  });

  describe('archive', () => {
    it('should archive staff member by setting is_active to false', async () => {
      const mockArchived = { id: '1', is_active: false };
      vi.spyOn(StaffRepository, 'update').mockResolvedValue(mockArchived);

      const result = await StaffRepository.archive('1');

      expect(result).toEqual(mockArchived);
      // The update method is called with three arguments: id, data, and salonId
      expect(StaffRepository.update).toHaveBeenCalledWith('1', { is_active: false }, expect.any(String));
    });

    it('should return null if staff not found', async () => {
      vi.spyOn(StaffRepository, 'update').mockResolvedValue(null);

      const result = await StaffRepository.archive('999');

      expect(result).toBeNull();
    });
  });

  describe('restore', () => {
    it('should restore staff member by setting is_active to true', async () => {
      const mockRestored = { id: '1', is_active: true };
      vi.spyOn(StaffRepository, 'update').mockResolvedValue(mockRestored);

      const result = await StaffRepository.restore('1');

      expect(result).toEqual(mockRestored);
      // The update method is called with three arguments: id, data, and salonId
      expect(StaffRepository.update).toHaveBeenCalledWith('1', { is_active: true }, expect.any(String));
    });

    it('should return null if staff not found', async () => {
      vi.spyOn(StaffRepository, 'update').mockResolvedValue(null);

      const result = await StaffRepository.restore('999');

      expect(result).toBeNull();
    });
  });

  describe('hasUpdatedAtColumn', () => {
    it('should return boolean result', async () => {
      // Reset the module to clear the cache
      vi.resetModules();
      const { StaffRepository: FreshStaffRepository } = await import('../../repositories/StaffRepository');
      vi.mocked(query).mockResolvedValue({ rows: [{}] });

      const result = await FreshStaffRepository.hasUpdatedAtColumn();

      expect(result).toBe(true);
    });
  });
});
