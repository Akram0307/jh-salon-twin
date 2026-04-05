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

describe('BookingOrchestrator - reschedule flow', () => {
  const mockSalonId = 'salon-123';
  const mockClientId = 'client-456';
  const mockServiceId = 'service-789';
  const mockStaffId = 'staff-012';
  const oldSlotTime = '2024-01-01T10:00:00Z';
  const newSlotTime = '2024-01-01T14:00:00Z';

  const mockService = {
    id: mockServiceId, name: 'Haircut', price: 50, duration: 30, salon_id: mockSalonId,
  };

  const mockStaff = {
    id: mockStaffId, full_name: 'Jane Doe', salon_id: mockSalonId,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create appointment at new time slot (reschedule via new booking)', async () => {
    const command: BookingCommand = {
      salonId: mockSalonId,
      clientId: mockClientId,
      serviceId: mockServiceId,
      staffId: mockStaffId,
      slotTime: newSlotTime,
    };

    const newAppointment = {
      id: 'apt-new',
      salon_id: mockSalonId,
      client_id: mockClientId,
      staff_id: mockStaffId,
      appointment_time: newSlotTime,
      status: 'SCHEDULED',
      qr_token: 'qr-new',
    };

    vi.mocked(ServiceRepository.findById).mockResolvedValue(mockService);
    vi.mocked(AppointmentRepository.create).mockResolvedValue(newAppointment);
    vi.mocked(StaffRepository.findById).mockResolvedValue(mockStaff);
    vi.mocked(sendConfirmationSMS).mockResolvedValue(undefined);

    const result = await BookingOrchestrator.createAppointment(command);

    expect(result.success).toBe(true);
    expect(result.confirmation?.dateTime).toBe(newSlotTime);
    expect(AppointmentRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ appointment_time: newSlotTime })
    );
  });

  it('should fail reschedule if new slot conflicts', async () => {
    const command: BookingCommand = {
      salonId: mockSalonId,
      clientId: mockClientId,
      serviceId: mockServiceId,
      staffId: mockStaffId,
      slotTime: newSlotTime,
    };

    vi.mocked(ServiceRepository.findById).mockResolvedValue(mockService);
    const conflictErr = new Error('Time slot is already booked') as Error & { statusCode: number; code: string };
    conflictErr.statusCode = 409;
    conflictErr.code = 'DOUBLE_BOOKING';
    vi.mocked(AppointmentRepository.create).mockRejectedValue(conflictErr);

    await expect(BookingOrchestrator.createAppointment(command))
      .rejects.toThrow('Time slot is already booked');
  });

  it('should handle reschedule with any available staff', async () => {
    const command: BookingCommand = {
      salonId: mockSalonId,
      clientId: mockClientId,
      serviceId: mockServiceId,
      staffId: 'any',
      slotTime: newSlotTime,
    };

    const newAppointment = {
      id: 'apt-new',
      salon_id: mockSalonId,
      client_id: mockClientId,
      appointment_time: newSlotTime,
      status: 'SCHEDULED',
      qr_token: 'qr-new',
    };

    vi.mocked(ServiceRepository.findById).mockResolvedValue(mockService);
    vi.mocked(AppointmentRepository.create).mockResolvedValue(newAppointment);
    vi.mocked(sendConfirmationSMS).mockResolvedValue(undefined);

    const result = await BookingOrchestrator.createAppointment(command);

    expect(result.success).toBe(true);
    expect(result.confirmation?.staffName).toBe('Any available stylist');
    expect(StaffRepository.findById).not.toHaveBeenCalled();
  });
});
