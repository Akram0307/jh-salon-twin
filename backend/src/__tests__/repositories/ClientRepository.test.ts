import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ClientRepository } from '../../repositories/ClientRepository';
import { query } from '../../config/db';

// Mock dependencies
vi.mock('../../config/db', () => ({
  query: vi.fn(),
}));

describe('ClientRepository', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.SALON_ID = 'test-salon-id';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('findAll', () => {
    it('should return all clients', async () => {
      const mockClients = [
        { id: '1', name: 'Client 1', email: 'client1@example.com' },
        { id: '2', name: 'Client 2', email: 'client2@example.com' },
      ];
      vi.mocked(query).mockResolvedValue({ rows: mockClients });

      const result = await ClientRepository.findAll();

      expect(result).toEqual(mockClients);
      expect(query).toHaveBeenCalledWith('SELECT * FROM clients ORDER BY created_at DESC');
    });

    it('should return empty array if no clients', async () => {
      vi.mocked(query).mockResolvedValue({ rows: [] });

      const result = await ClientRepository.findAll();

      expect(result).toEqual([]);
      expect(query).toHaveBeenCalledWith('SELECT * FROM clients ORDER BY created_at DESC');
    });

    it('should throw error on database failure', async () => {
      vi.mocked(query).mockRejectedValue(new Error('Database error'));

      await expect(ClientRepository.findAll()).rejects.toThrow('Database error');
    });
  });

  describe('findByPhone', () => {
    it('should return client by phone number', async () => {
      const mockClient = { id: '1', name: 'Client 1', phone_number: '1234567890' };
      vi.mocked(query).mockResolvedValue({ rows: [mockClient] });

      const result = await ClientRepository.findByPhone('1234567890');

      expect(result).toEqual(mockClient);
      expect(query).toHaveBeenCalledWith('SELECT * FROM clients WHERE phone_number = $1', ['1234567890']);
    });

    it('should return undefined if client not found', async () => {
      vi.mocked(query).mockResolvedValue({ rows: [] });

      const result = await ClientRepository.findByPhone('1234567890');

      expect(result).toBeUndefined();
      expect(query).toHaveBeenCalledWith('SELECT * FROM clients WHERE phone_number = $1', ['1234567890']);
    });

    it('should throw error on database failure', async () => {
      vi.mocked(query).mockRejectedValue(new Error('Database error'));

      await expect(ClientRepository.findByPhone('1234567890')).rejects.toThrow('Database error');
    });
  });

  describe('create', () => {
    it('should create a new client', async () => {
      const mockClient = { id: '1', name: 'New Client', phone_number: '1234567890' };
      vi.mocked(query).mockResolvedValue({ rows: [mockClient] });

      const data = {
        phone_number: '1234567890',
        full_name: 'New Client',
        preferences: { color: 'blue' },
      };
      const result = await ClientRepository.create(data);

      expect(result).toEqual(mockClient);
      expect(query).toHaveBeenCalledWith(
        `INSERT INTO clients (salon_id, phone_number, full_name, preferences)
             VALUES ($1,$2,$3,$4)
             RETURNING *`,
        [process.env.SALON_ID, '1234567890', 'New Client', { color: 'blue' }]
      );
    });

    it('should use provided salon_id', async () => {
      const mockClient = { id: '1', name: 'New Client', phone_number: '1234567890' };
      vi.mocked(query).mockResolvedValue({ rows: [mockClient] });

      const data = {
        salon_id: 'salon-123',
        phone_number: '1234567890',
        full_name: 'New Client',
        preferences: { color: 'blue' },
      };
      const result = await ClientRepository.create(data);

      expect(result).toEqual(mockClient);
      expect(query).toHaveBeenCalledWith(
        `INSERT INTO clients (salon_id, phone_number, full_name, preferences)
             VALUES ($1,$2,$3,$4)
             RETURNING *`,
        ['salon-123', '1234567890', 'New Client', { color: 'blue' }]
      );
    });

    it('should throw error if salon_id not provided and SALON_ID env not set', async () => {
      delete process.env.SALON_ID;
      const data = {
        phone_number: '1234567890',
        full_name: 'New Client',
      };
      await expect(ClientRepository.create(data)).rejects.toThrow(
        'SALON_ID environment variable not set and salon_id not provided'
      );
    });

    it('should throw error on database failure', async () => {
      vi.mocked(query).mockRejectedValue(new Error('Database error'));
      const data = {
        phone_number: '1234567890',
        full_name: 'New Client',
      };
      await expect(ClientRepository.create(data)).rejects.toThrow('Database error');
    });
  });
});
