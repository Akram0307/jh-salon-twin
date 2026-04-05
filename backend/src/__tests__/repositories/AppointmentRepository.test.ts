import { AppointmentRepository } from '../../repositories/AppointmentRepository';
import { pool } from '../../config/db';

// Mock the pool
vi.mock('../../config/db', () => {
  const mockQuery = vi.fn();
  const mockPool = {
    query: mockQuery,
    connect: vi.fn(),
    on: vi.fn(),
    end: vi.fn()
  };
  return {
    query: mockQuery,
    pool: mockPool,
    getClient: vi.fn(),
    default: mockPool
  };
});

describe('AppointmentRepository', () => {
  const mockQuery = pool.query as vi.Mock;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockQueryResult = (rows: any[]) => ({
    rows,
    command: 'SELECT',
    rowCount: rows.length,
    oid: 0,
    fields: []
  });

  describe('findById', () => {
    it('should return appointment when found', async () => {
      const mockAppointment = {
        id: 'apt-1',
        client_name: 'John Doe',
        staff_name: 'Jane Smith',
        services: []
      };
      mockQuery.mockResolvedValue(mockQueryResult([mockAppointment]));

      const result = await AppointmentRepository.findById('apt-1', 'salon-1');
      expect(result).toEqual(mockAppointment);
      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('a.id = $1 AND a.salon_id = $2'), ['apt-1', 'salon-1']);
    });

    it('should return null when not found', async () => {
      mockQuery.mockResolvedValue(mockQueryResult([]));
      const result = await AppointmentRepository.findById('nonexistent');
      expect(result).toBeNull();
    });
  });


  describe('findByQrToken', () => {
    it('should return appointment for valid QR token', async () => {
      const mockAppointment = { id: 'apt-1', qr_token: 'token-123' };
      mockQuery.mockResolvedValue(mockQueryResult([mockAppointment]));

      const result = await AppointmentRepository.findByQrToken('token-123');
      expect(result).toEqual(mockAppointment);
    });

    it('should return null for invalid QR token', async () => {
      mockQuery.mockResolvedValue(mockQueryResult([]));
      const result = await AppointmentRepository.findByQrToken('invalid');
      expect(result).toBeNull();
    });
  });

  describe('getAppointmentRevenue', () => {
    it('should return revenue details for appointment', async () => {
      const mockRevenue = {
        id: 'rev-1',
        appointment_id: 'apt-1',
        base_price: 100,
        charged_price: 120
      };
      mockQuery.mockResolvedValue(mockQueryResult([mockRevenue]));

      const result = await AppointmentRepository.getAppointmentRevenue('apt-1');
      expect(result).toEqual(mockRevenue);
    });
  });

  describe('getTotalRevenue', () => {
    it('should return total revenue for date range', async () => {
      const mockTotal = { total: 5000, count: 25 };
      mockQuery.mockResolvedValue(mockQueryResult([mockTotal]));

      const result = await AppointmentRepository.getTotalRevenue('2024-01-01', '2024-01-31');
      expect(result).toEqual(mockTotal);
    });
  });

  describe('getRevenueByService', () => {
    it('should return revenue grouped by service', async () => {
      const mockRevenue = [
        { service_name: 'Haircut', total: 2000, count: 20 },
        { service_name: 'Coloring', total: 3000, count: 15 }
      ];
      mockQuery.mockResolvedValue(mockQueryResult(mockRevenue));

      const result = await AppointmentRepository.getRevenueByService('2024-01-01', '2024-01-31');
      expect(result).toHaveLength(2);
    });
  });
});
