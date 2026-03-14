import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppointmentRepository } from '../../repositories/AppointmentRepository';
import { query, pool } from '../../config/db';

vi.mock('../../config/db', () => ({
  query: vi.fn(),
  pool: {
    connect: vi.fn(),
  },
}));

describe('AppointmentRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all appointments with services', async () => {
      const mockRows = [
        { id: '1', client_name: 'John', staff_name: 'Jane', services: [] },
      ];
      vi.mocked(query).mockResolvedValue({ rows: mockRows });

      const result = await AppointmentRepository.findAll();

      expect(result).toEqual(mockRows);
      expect(query).toHaveBeenCalledWith(expect.stringContaining('SELECT'));
    });

    it('should return empty array if no appointments', async () => {
      vi.mocked(query).mockResolvedValue({ rows: [] });

      const result = await AppointmentRepository.findAll();

      expect(result).toEqual([]);
    });

    it('should throw error on database failure', async () => {
      vi.mocked(query).mockRejectedValue(new Error('Database error'));

      await expect(AppointmentRepository.findAll()).rejects.toThrow('Database error');
    });
  });

  describe('create', () => {
    it('should create an appointment with services', async () => {
      const mockClient = {
        query: vi.fn(),
        release: vi.fn(),
      };
      vi.mocked(pool.connect).mockResolvedValue(mockClient);
      mockClient.query.mockResolvedValueOnce({}); // BEGIN
      mockClient.query.mockResolvedValueOnce({ rows: [{ id: '1' }] }); // INSERT appointment
      mockClient.query.mockResolvedValueOnce({}); // INSERT service
      mockClient.query.mockResolvedValueOnce({}); // COMMIT

      const appointment = {
        salon_id: 'salon-1',
        client_id: 'client-1',
        appointment_time: '2024-01-01T10:00:00Z',
        services: [{ service_id: 'service-1', base_price: 50 }],
      };

      const result = await AppointmentRepository.create(appointment);

      expect(result).toEqual({ id: '1' });
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO appointments'),
        expect.arrayContaining(['salon-1', 'client-1', null, '2024-01-01T10:00:00Z', 'SCHEDULED', expect.any(String)])
      );
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    });

    it('should rollback on error', async () => {
      const mockClient = {
        query: vi.fn(),
        release: vi.fn(),
      };
      vi.mocked(pool.connect).mockResolvedValue(mockClient);
      mockClient.query.mockResolvedValueOnce({}); // BEGIN
      mockClient.query.mockRejectedValueOnce(new Error('Insert failed'));

      const appointment = {
        salon_id: 'salon-1',
        client_id: 'client-1',
        appointment_time: '2024-01-01T10:00:00Z',
        services: [],
      };

      await expect(AppointmentRepository.create(appointment)).rejects.toThrow('Insert failed');
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });
  });

  describe('updateStatus', () => {
    it('should update appointment status', async () => {
      const mockAppointment = { id: '1', status: 'SCHEDULED' };
      vi.mocked(query).mockResolvedValue({ rows: [mockAppointment] });

      const result = await AppointmentRepository.updateStatus('1', 'scheduled');

      expect(result).toEqual(mockAppointment);
      expect(query).toHaveBeenCalledWith(
        `UPDATE appointments SET status = $1 WHERE id = $2 RETURNING *`,
        ['SCHEDULED', '1']
      );
    });

    it('should return undefined if appointment not found', async () => {
      vi.mocked(query).mockResolvedValue({ rows: [] });

      const result = await AppointmentRepository.updateStatus('999', 'scheduled');

      expect(result).toBeUndefined();
    });

    it('should throw error on database failure', async () => {
      vi.mocked(query).mockRejectedValue(new Error('Database error'));

      await expect(AppointmentRepository.updateStatus('1', 'scheduled')).rejects.toThrow('Database error');
    });
  });

  describe('findByQrToken', () => {
    it('should return appointment by QR token', async () => {
      const mockAppointment = { id: '1', qr_token: 'token123' };
      vi.mocked(query).mockResolvedValue({ rows: [mockAppointment] });

      const result = await AppointmentRepository.findByQrToken('token123');

      expect(result).toEqual(mockAppointment);
      expect(query).toHaveBeenCalledWith(
        `SELECT * FROM appointments WHERE qr_token = $1 LIMIT 1`,
        ['token123']
      );
    });

    it('should return null if appointment not found', async () => {
      vi.mocked(query).mockResolvedValue({ rows: [] });

      const result = await AppointmentRepository.findByQrToken('token123');

      expect(result).toBeNull();
    });

    it('should throw error on database failure', async () => {
      vi.mocked(query).mockRejectedValue(new Error('Database error'));

      await expect(AppointmentRepository.findByQrToken('token123')).rejects.toThrow('Database error');
    });
  });

  describe('addService', () => {
    it('should add a service to an appointment', async () => {
      const mockService = { id: 'service-1', appointment_id: '1', base_price: 50, charged_price: 50 };
      vi.mocked(query).mockResolvedValue({ rows: [mockService] });

      const result = await AppointmentRepository.addService('1', 'service-1', 50, 50);

      expect(result).toEqual(mockService);
      expect(query).toHaveBeenCalledWith(
        `INSERT INTO appointment_services (appointment_id, service_id, base_price, charged_price)
       VALUES ($1,$2,$3,$4)
       RETURNING *`,
        ['1', 'service-1', 50, 50]
      );
    });

    it('should throw error on database failure', async () => {
      vi.mocked(query).mockRejectedValue(new Error('Database error'));

      await expect(AppointmentRepository.addService('1', 'service-1', 50, 50)).rejects.toThrow('Database error');
    });
  });

  describe('updateServicePrice', () => {
    it('should update service price on an appointment', async () => {
      const mockService = { id: 'service-1', appointment_id: '1', charged_price: 60 };
      vi.mocked(query).mockResolvedValue({ rows: [mockService] });

      const result = await AppointmentRepository.updateServicePrice('1', 'service-1', 60);

      expect(result).toEqual(mockService);
      // Match the exact SQL formatting from the implementation (7 spaces before SET)
      expect(query).toHaveBeenCalledWith(
        `UPDATE appointment_services
       SET charged_price = $1
       WHERE appointment_id = $2 AND service_id = $3
       RETURNING *`,
        [60, '1', 'service-1']
      );
    });

    it('should return undefined if service not found on appointment', async () => {
      vi.mocked(query).mockResolvedValue({ rows: [] });

      const result = await AppointmentRepository.updateServicePrice('1', 'service-1', 60);

      expect(result).toBeUndefined();
    });

    it('should throw error on database failure', async () => {
      vi.mocked(query).mockRejectedValue(new Error('Database error'));

      await expect(AppointmentRepository.updateServicePrice('1', 'service-1', 60)).rejects.toThrow('Database error');
    });
  });
});
