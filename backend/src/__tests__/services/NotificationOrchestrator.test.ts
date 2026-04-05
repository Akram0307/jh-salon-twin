import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as NotificationOrchestrator from '../../services/NotificationOrchestrator';

// Mock dependencies
vi.mock('../../services/SMSNotificationService', () => ({
  sendSMS: vi.fn(),
}));

vi.mock('../../services/EmailNotificationService', () => ({
  sendEmail: vi.fn(),
  sendTemplateEmail: vi.fn(),
}));

vi.mock('../../config/db', () => ({
  query: vi.fn(),
}));

vi.mock('../../repositories/NotificationLogRepository', () => ({
  NotificationLogRepository: {
    create: vi.fn(),
  },
}));

import { sendSMS } from '../../services/SMSNotificationService';
import { sendEmail, sendTemplateEmail } from '../../services/EmailNotificationService';
import { query } from '../../config/db';
import { NotificationLogRepository } from '../../repositories/NotificationLogRepository';

const mockSendSMS = vi.mocked(sendSMS);
const mockSendEmail = vi.mocked(sendEmail);
const mockSendTemplateEmail = vi.mocked(sendTemplateEmail);
const mockQuery = vi.mocked(query);
const mockNotificationLogCreate = vi.mocked(NotificationLogRepository.create);

describe('NotificationOrchestrator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set TEST_MODE to true to use test values
    process.env.TEST_MODE = 'true';
  });

  describe('sendConfirmationSMS', () => {
    it('should send confirmation SMS and log notification', async () => {
      const payload = {
        appointmentId: 'apt-123',
        salonId: 'salon-123',
        clientId: 'client-123',
        serviceName: 'Haircut',
        staffName: 'John',
        dateTime: '2024-01-15 10:00',
      };

      mockSendSMS.mockResolvedValue({ success: true });
      mockNotificationLogCreate.mockResolvedValue({} as any);

      const result = await NotificationOrchestrator.sendConfirmationSMS(payload);

      expect(mockSendSMS).toHaveBeenCalledWith(
        expect.objectContaining({
          to: '+10000000000',
          body: expect.stringContaining('Haircut'),
          salonId: 'salon-123',
        })
      );
      expect(mockNotificationLogCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          salon_id: 'salon-123',
          user_id: 'client-123',
          type: 'sms',
          recipient: '+10000000000',
          status: 'sent',
        })
      );
      expect(result).toEqual({ success: true });
    });

    it('should return skipped when no phone', async () => {
      // Disable TEST_MODE to test no phone scenario
      delete process.env.TEST_MODE;
      mockQuery.mockResolvedValue({ rows: [] });

      const result = await NotificationOrchestrator.sendConfirmationSMS({
        appointmentId: 'apt-123',
        salonId: 'salon-123',
        clientId: 'client-123',
        serviceName: 'Haircut',
        staffName: 'John',
        dateTime: '2024-01-15 10:00',
      });

      expect(result).toEqual({ skipped: true, reason: 'no_phone' });
      expect(mockSendSMS).not.toHaveBeenCalled();
    });
  });

  describe('sendReminderSMS', () => {
    it('should send reminder SMS and log notification', async () => {
      const payload = {
        appointmentId: 'apt-123',
        salonId: 'salon-123',
        clientId: 'client-123',
        serviceName: 'Haircut',
        dateTime: '2024-01-15 10:00',
      };

      mockSendSMS.mockResolvedValue({ success: true });
      mockNotificationLogCreate.mockResolvedValue({} as any);

      const result = await NotificationOrchestrator.sendReminderSMS(payload);

      expect(mockSendSMS).toHaveBeenCalledWith(
        expect.objectContaining({
          to: '+10000000000',
          body: expect.stringContaining('Reminder'),
          salonId: 'salon-123',
        })
      );
      expect(mockNotificationLogCreate).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });
  });

  describe('sendConfirmationEmail', () => {
    it('should send confirmation email and log notification', async () => {
      const payload = {
        appointmentId: 'apt-123',
        salonId: 'salon-123',
        clientId: 'client-123',
        serviceName: 'Haircut',
        staffName: 'John',
        dateTime: '2024-01-15 10:00',
      };

      mockSendEmail.mockResolvedValue({ success: true });
      mockNotificationLogCreate.mockResolvedValue({} as any);

      const result = await NotificationOrchestrator.sendConfirmationEmail(payload);

      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          subject: expect.stringContaining('Confirmed'),
          html: expect.stringContaining('Haircut'),
          salonId: 'salon-123',
        })
      );
      expect(mockNotificationLogCreate).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });

    it('should return skipped when no email', async () => {
      delete process.env.TEST_MODE;
      mockQuery.mockResolvedValue({ rows: [] });

      const result = await NotificationOrchestrator.sendConfirmationEmail({
        appointmentId: 'apt-123',
        salonId: 'salon-123',
        clientId: 'client-123',
        serviceName: 'Haircut',
        staffName: 'John',
        dateTime: '2024-01-15 10:00',
      });

      expect(result).toEqual({ success: false, skipped: true, reason: 'no_email' });
      expect(mockSendEmail).not.toHaveBeenCalled();
    });
  });

  describe('sendReminderEmail', () => {
    it('should send reminder email and log notification', async () => {
      const payload = {
        appointmentId: 'apt-123',
        salonId: 'salon-123',
        clientId: 'client-123',
        serviceName: 'Haircut',
        dateTime: '2024-01-15 10:00',
      };

      mockSendEmail.mockResolvedValue({ success: true });
      mockNotificationLogCreate.mockResolvedValue({} as any);

      const result = await NotificationOrchestrator.sendReminderEmail(payload);

      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          subject: expect.stringContaining('Reminder'),
          html: expect.stringContaining('Haircut'),
          salonId: 'salon-123',
        })
      );
      expect(mockNotificationLogCreate).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });
  });

  describe('dispatchNotification', () => {
    it('should dispatch email notification with template', async () => {
      const payload = {
        salonId: 'salon-123',
        userId: 'user-123',
        userType: 'client' as const,
        type: 'email' as const,
        templateName: 'welcome',
        recipient: 'test@example.com',
        dynamicData: { name: 'John' },
      };

      mockQuery.mockResolvedValue({ rows: [{ notification_preferences: { email: true, sms: true, push: true } }] });
      mockSendTemplateEmail.mockResolvedValue({ success: true });
      mockNotificationLogCreate.mockResolvedValue({} as any);

      const result = await NotificationOrchestrator.dispatchNotification(payload);

      expect(mockSendTemplateEmail).toHaveBeenCalledWith(
        'test@example.com',
        'welcome',
        'salon-123',
        { name: 'John' }
      );
      expect(mockNotificationLogCreate).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });

    it('should skip email when email notifications disabled', async () => {
      const payload = {
        salonId: 'salon-123',
        userId: 'user-123',
        userType: 'client' as const,
        type: 'email' as const,
        recipient: 'test@example.com',
        content: 'Test content',
      };

      mockQuery.mockResolvedValue({ rows: [{ notification_preferences: { email: false, sms: true, push: true } }] });

      const result = await NotificationOrchestrator.dispatchNotification(payload);

      expect(result).toEqual({ skipped: true, reason: 'email_disabled' });
      expect(mockSendEmail).not.toHaveBeenCalled();
    });

    it('should dispatch SMS notification', async () => {
      const payload = {
        salonId: 'salon-123',
        userId: 'user-123',
        userType: 'client' as const,
        type: 'sms' as const,
        recipient: '+1234567890',
        content: 'Test SMS',
      };

      mockQuery.mockResolvedValue({ rows: [{ notification_preferences: { email: true, sms: true, push: true } }] });
      mockSendSMS.mockResolvedValue({ success: true });
      mockNotificationLogCreate.mockResolvedValue({} as any);

      const result = await NotificationOrchestrator.dispatchNotification(payload);

      expect(mockSendSMS).toHaveBeenCalledWith(
        expect.objectContaining({
          to: '+1234567890',
          body: 'Test SMS',
          salonId: 'salon-123',
        })
      );
      expect(mockNotificationLogCreate).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });

    it('should return error for push notifications', async () => {
      const payload = {
        salonId: 'salon-123',
        userId: 'user-123',
        userType: 'client' as const,
        type: 'push' as const,
        recipient: 'device-token',
        content: 'Test push',
      };

      mockQuery.mockResolvedValue({ rows: [{ notification_preferences: { email: true, sms: true, push: true } }] });
      mockNotificationLogCreate.mockResolvedValue({} as any);

      const result = await NotificationOrchestrator.dispatchNotification(payload);

      expect(result).toEqual({ success: false, error: 'push_not_implemented' });
      expect(mockNotificationLogCreate).toHaveBeenCalled();
    });
  });

  describe('dispatchReminderForAppointment', () => {
    it('should send both SMS and email reminders', async () => {
      const mockAppointment = {
        id: 'apt-123',
        salon_id: 'salon-123',
        client_id: 'client-123',
        appointment_time: '2024-01-15 10:00',
        service_name: 'Haircut',
        staff_name: 'John',
      };

      mockQuery.mockResolvedValue({ rows: [mockAppointment] });
      mockSendSMS.mockResolvedValue({ success: true });
      mockSendEmail.mockResolvedValue({ success: true });
      mockNotificationLogCreate.mockResolvedValue({} as any);

      const result = await NotificationOrchestrator.dispatchReminderForAppointment('apt-123');

      expect(mockSendSMS).toHaveBeenCalled();
      expect(mockSendEmail).toHaveBeenCalled();
      expect(result).toEqual({
        sms: { success: true },
        email: { success: true },
      });
    });

    it('should return error when appointment not found', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const result = await NotificationOrchestrator.dispatchReminderForAppointment('non-existent');

      expect(result).toEqual({ error: 'appointment_not_found' });
    });
  });

  describe('sendAppointmentConfirmation', () => {
    it('should send both SMS and email confirmations', async () => {
      const mockAppointment = {
        id: 'apt-123',
        salon_id: 'salon-123',
        client_id: 'client-123',
        appointment_time: '2024-01-15 10:00',
        service_name: 'Haircut',
        staff_name: 'John',
      };

      mockQuery.mockResolvedValue({ rows: [mockAppointment] });
      mockSendSMS.mockResolvedValue({ success: true });
      mockSendEmail.mockResolvedValue({ success: true });
      mockNotificationLogCreate.mockResolvedValue({} as any);

      const result = await NotificationOrchestrator.sendAppointmentConfirmation('apt-123');

      expect(mockSendSMS).toHaveBeenCalled();
      expect(mockSendEmail).toHaveBeenCalled();
      expect(result).toEqual({
        sms: { success: true },
        email: { success: true },
      });
    });

    it('should return error when appointment not found', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const result = await NotificationOrchestrator.sendAppointmentConfirmation('non-existent');

      expect(result).toEqual({ error: 'appointment_not_found' });
    });
  });
});
