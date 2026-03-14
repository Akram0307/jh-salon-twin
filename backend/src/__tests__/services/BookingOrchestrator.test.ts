import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BookingOrchestrator, BookingCommand } from '../../services/BookingOrchestrator';
import { AppointmentRepository } from '../../repositories/AppointmentRepository';
import { ServiceRepository } from '../../repositories/ServiceRepository';
import { StaffRepository } from '../../repositories/StaffRepository';
import { sendConfirmationSMS } from '../../services/NotificationOrchestrator';

// Mock the dependencies
vi.mock('../../repositories/AppointmentRepository');
vi.mock('../../repositories/ServiceRepository');
vi.mock('../../repositories/StaffRepository');
vi.mock('../../services/NotificationOrchestrator');

describe('BookingOrchestrator', () => {
  const mockSalonId = 'salon-123';
  const mockClientId = 'client-456';
  const mockServiceId = 'service-789';
  const mockStaffId = 'staff-012';
  const mockSlotTime = '2024-01-01T10:00:00Z';

  const mockService = {
    id: mockServiceId,
    name: 'Haircut',
    price: 50,
    duration: 30,
    salon_id: mockSalonId,
  };

  const mockAppointment = {
    id: 'appointment-abc',
    salon_id: mockSalonId,
    client_id: mockClientId,
    staff_id: mockStaffId,
    appointment_time: mockSlotTime,
    status: 'SCHEDULED',
    services: [
      {
        service_id: mockServiceId,
        base_price: mockService.price,
        charged_price: mockService.price,
      },
    ],
    qr_token: 'qr-token-123',
  };

  const mockStaff = {
    id: mockStaffId,
    full_name: 'John Doe',
    salon_id: mockSalonId,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createAppointment', () => {
    it('should create an appointment successfully with a specific staff', async () => {
      // Arrange
      const command: BookingCommand = {
        salonId: mockSalonId,
        clientId: mockClientId,
        serviceId: mockServiceId,
        staffId: mockStaffId,
        slotTime: mockSlotTime,
      };

      vi.mocked(ServiceRepository.findById).mockResolvedValue(mockService);
      vi.mocked(AppointmentRepository.create).mockResolvedValue(mockAppointment);
      vi.mocked(StaffRepository.findById).mockResolvedValue(mockStaff);
      vi.mocked(sendConfirmationSMS).mockResolvedValue(undefined);

      // Act
      const result = await BookingOrchestrator.createAppointment(command);

      // Assert
      expect(result.success).toBe(true);
      expect(result.appointmentId).toBe(mockAppointment.id);
      expect(result.confirmation).toEqual({
        serviceName: mockService.name,
        staffName: mockStaff.full_name,
        dateTime: mockSlotTime,
        qrToken: mockAppointment.qr_token,
      });

      // Verify the dependencies were called correctly
      expect(ServiceRepository.findById).toHaveBeenCalledWith(mockServiceId, mockSalonId);
      expect(AppointmentRepository.create).toHaveBeenCalledWith({
        salon_id: mockSalonId,
        client_id: mockClientId,
        staff_id: mockStaffId,
        appointment_time: mockSlotTime,
        status: 'SCHEDULED',
        services: [
          {
            service_id: mockServiceId,
            base_price: mockService.price,
            charged_price: mockService.price,
          },
        ],
      });
      expect(StaffRepository.findById).toHaveBeenCalledWith(mockStaffId, mockSalonId);
      expect(sendConfirmationSMS).toHaveBeenCalledWith({
        appointmentId: mockAppointment.id,
        salonId: mockSalonId,
        clientId: mockClientId,
        serviceName: mockService.name,
        staffName: mockStaff.full_name,
        dateTime: mockSlotTime,
      });
    });

    it('should create an appointment successfully with any available staff', async () => {
      // Arrange
      const command: BookingCommand = {
        salonId: mockSalonId,
        clientId: mockClientId,
        serviceId: mockServiceId,
        staffId: 'any',
        slotTime: mockSlotTime,
      };

      vi.mocked(ServiceRepository.findById).mockResolvedValue(mockService);
      vi.mocked(AppointmentRepository.create).mockResolvedValue(mockAppointment);
      vi.mocked(StaffRepository.findById).mockResolvedValue(null); // No specific staff
      vi.mocked(sendConfirmationSMS).mockResolvedValue(undefined);

      // Act
      const result = await BookingOrchestrator.createAppointment(command);

      // Assert
      expect(result.success).toBe(true);
      expect(result.appointmentId).toBe(mockAppointment.id);
      expect(result.confirmation?.staffName).toBe('Any available stylist');

      // Verify the dependencies were called correctly
      expect(ServiceRepository.findById).toHaveBeenCalledWith(mockServiceId, mockSalonId);
      expect(AppointmentRepository.create).toHaveBeenCalledWith({
        salon_id: mockSalonId,
        client_id: mockClientId,
        staff_id: undefined, // normalized to undefined
        appointment_time: mockSlotTime,
        status: 'SCHEDULED',
        services: [
          {
            service_id: mockServiceId,
            base_price: mockService.price,
            charged_price: mockService.price,
          },
        ],
      });
      expect(StaffRepository.findById).not.toHaveBeenCalled(); // because staffId is 'any'
      expect(sendConfirmationSMS).toHaveBeenCalled();
    });

    it('should return error when service is not found', async () => {
      // Arrange
      const command: BookingCommand = {
        salonId: mockSalonId,
        clientId: mockClientId,
        serviceId: 'non-existent-service',
        staffId: mockStaffId,
        slotTime: mockSlotTime,
      };

      vi.mocked(ServiceRepository.findById).mockResolvedValue(null);

      // Act
      const result = await BookingOrchestrator.createAppointment(command);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Service not found');
      expect(result.appointmentId).toBeUndefined();
      expect(result.confirmation).toBeUndefined();

      // Verify the dependencies were called correctly
      expect(ServiceRepository.findById).toHaveBeenCalledWith('non-existent-service', mockSalonId);
      expect(AppointmentRepository.create).not.toHaveBeenCalled();
      expect(StaffRepository.findById).not.toHaveBeenCalled();
      expect(sendConfirmationSMS).not.toHaveBeenCalled();
    });

    it('should handle SMS sending failure gracefully', async () => {
      // Arrange
      const command: BookingCommand = {
        salonId: mockSalonId,
        clientId: mockClientId,
        serviceId: mockServiceId,
        staffId: mockStaffId,
        slotTime: mockSlotTime,
      };

      vi.mocked(ServiceRepository.findById).mockResolvedValue(mockService);
      vi.mocked(AppointmentRepository.create).mockResolvedValue(mockAppointment);
      vi.mocked(StaffRepository.findById).mockResolvedValue(mockStaff);
      vi.mocked(sendConfirmationSMS).mockRejectedValue(new Error('SMS service unavailable'));

      // Act
      const result = await BookingOrchestrator.createAppointment(command);

      // Assert
      expect(result.success).toBe(true); // Appointment should still be created
      expect(result.appointmentId).toBe(mockAppointment.id);
      expect(result.confirmation).toBeDefined();

      // Verify the dependencies were called correctly
      expect(ServiceRepository.findById).toHaveBeenCalled();
      expect(AppointmentRepository.create).toHaveBeenCalled();
      expect(StaffRepository.findById).toHaveBeenCalled();
      expect(sendConfirmationSMS).toHaveBeenCalled();
    });
  });
});
