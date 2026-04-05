import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BookingOrchestrator, BookingCommand } from '../../services/BookingOrchestrator';
import { AppointmentRepository } from '../../repositories/AppointmentRepository';
import { ServiceRepository } from '../../repositories/ServiceRepository';
import { StaffRepository } from '../../repositories/StaffRepository';
import { sendConfirmationSMS } from '../../services/NotificationOrchestrator';

vi.mock('../../config/queue', () => ({
  QueueConnection: {},
  QUEUE_NAMES: {},
  createQueue: vi.fn(),
  createWorker: vi.fn(),
  registerWorker: vi.fn(),
  shutdownAllWorkers: vi.fn(),
}));
vi.mock('../../services/WaitlistWorker', () => ({
  WaitlistWorker: { enqueueSlotEvent: vi.fn() },
}));
vi.mock('../../repositories/AppointmentRepository');
vi.mock('../../repositories/ServiceRepository');
vi.mock('../../repositories/StaffRepository');
vi.mock('../../services/NotificationOrchestrator');

describe('BookingOrchestrator - conflict handling', () => {
  const mockSalonId = 'salon-123';
  const mockClientId = 'client-456';
  const mockServiceId = 'service-789';
  const mockStaffId = 'staff-012';
  const mockSlotTime = '2024-01-01T10:00:00Z';

  const mockService = {
    id: mockServiceId, name: 'Haircut', price: 50, duration: 30, salon_id: mockSalonId,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should propagate double-booking conflict error from repository', async () => {
    const command: BookingCommand = {
      salonId: mockSalonId,
      clientId: mockClientId,
      serviceId: mockServiceId,
      staffId: mockStaffId,
      slotTime: mockSlotTime,
    };

    vi.mocked(ServiceRepository.findById).mockResolvedValue(mockService);
    const conflictErr = new Error('Time slot is already booked for this staff member') as Error & { statusCode: number; code: string };
    conflictErr.statusCode = 409;
    conflictErr.code = 'DOUBLE_BOOKING';
    vi.mocked(AppointmentRepository.create).mockRejectedValue(conflictErr);

    await expect(BookingOrchestrator.createAppointment(command))
      .rejects.toThrow('Time slot is already booked for this staff member');

    expect(ServiceRepository.findById).toHaveBeenCalled();
    expect(AppointmentRepository.create).toHaveBeenCalled();
    expect(sendConfirmationSMS).not.toHaveBeenCalled();
  });

  it('should propagate generic database errors from repository', async () => {
    const command: BookingCommand = {
      salonId: mockSalonId,
      clientId: mockClientId,
      serviceId: mockServiceId,
      staffId: mockStaffId,
      slotTime: mockSlotTime,
    };

    vi.mocked(ServiceRepository.findById).mockResolvedValue(mockService);
    vi.mocked(AppointmentRepository.create).mockRejectedValue(new Error('Connection refused'));

    await expect(BookingOrchestrator.createAppointment(command))
      .rejects.toThrow('Connection refused');
  });

  it('should not attempt booking when service lookup fails', async () => {
    const command: BookingCommand = {
      salonId: mockSalonId,
      clientId: mockClientId,
      serviceId: 'nonexistent',
      staffId: mockStaffId,
      slotTime: mockSlotTime,
    };

    vi.mocked(ServiceRepository.findById).mockResolvedValue(null);

    const result = await BookingOrchestrator.createAppointment(command);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Service not found');
    expect(AppointmentRepository.create).not.toHaveBeenCalled();
  });
});
