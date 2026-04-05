import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Use vi.hoisted to define mocks that can be used in vi.mock
const { mockCreate, mockTwilioClient, mockQuery } = vi.hoisted(() => {
  const mockCreate = vi.fn();
  const mockTwilioClient = {
    messages: {
      create: mockCreate,
    },
  };
  const mockQuery = vi.fn();
  return { mockCreate, mockTwilioClient, mockQuery };
});

// Mock twilio
vi.mock('twilio', () => ({
  default: vi.fn(() => mockTwilioClient),
}));

// Mock db
vi.mock('../../config/db', () => ({
  query: mockQuery,
}));

describe('SMSNotificationService', () => {
  let sendSMS: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Set environment variables for Twilio
    process.env.TWILIO_ACCOUNT_SID = 'test_sid';
    process.env.TWILIO_AUTH_TOKEN = 'test_token';
    process.env.TWILIO_WHATSAPP_NUMBER = 'test_sender';
    
    // Reset modules and import the module to get fresh instance with new env vars
    vi.resetModules();
    const module = await import('../../services/SMSNotificationService');
    sendSMS = module.sendSMS;
  });

  afterEach(() => {
    delete process.env.TWILIO_ACCOUNT_SID;
    delete process.env.TWILIO_AUTH_TOKEN;
    delete process.env.TWILIO_WHATSAPP_NUMBER;
  });

  describe('sendSMS', () => {
    it('should simulate SMS for test numbers', async () => {
      const result = await sendSMS({
        to: '+10000000000',
        body: 'Test message',
        salonId: 'salon-123',
      });

      expect(result).toEqual({ simulated: true, sid: 'SIMULATED' });
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('should simulate SMS for another test number', async () => {
      const result = await sendSMS({
        to: '+15555555555',
        body: 'Test message',
        salonId: 'salon-123',
      });

      expect(result).toEqual({ simulated: true, sid: 'SIMULATED' });
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('should send real SMS for non-test numbers', async () => {
      mockQuery.mockResolvedValue({ rows: [] });
      mockCreate.mockResolvedValue({ sid: 'SM123', status: 'sent' });

      const result = await sendSMS({
        to: '+1234567890',
        body: 'Real message',
        salonId: 'salon-123',
      });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'whatsapp:test_sender',
          to: 'whatsapp:+1234567890',
          body: 'Real message',
        })
      );
      expect(result).toEqual({ sid: 'SM123', status: 'sent' });
    });

    it('should use salon-specific sender when available', async () => {
      mockQuery.mockResolvedValue({ rows: [{ whatsapp_sender_number: 'salon_sender' }] });
      mockCreate.mockResolvedValue({ sid: 'SM456', status: 'sent' });

      const result = await sendSMS({
        to: '+1234567890',
        body: 'Real message',
        salonId: 'salon-123',
      });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'whatsapp:salon_sender',
          to: 'whatsapp:+1234567890',
          body: 'Real message',
        })
      );
      expect(result).toEqual({ sid: 'SM456', status: 'sent' });
    });

    it('should retry on failure and eventually succeed', async () => {
      mockQuery.mockResolvedValue({ rows: [] });
      mockCreate
        .mockRejectedValueOnce(new Error('Twilio error'))
        .mockResolvedValueOnce({ sid: 'SM789', status: 'sent' });

      const result = await sendSMS({
        to: '+1234567890',
        body: 'Real message',
        salonId: 'salon-123',
      });

      expect(mockCreate).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ sid: 'SM789', status: 'sent' });
    });

    it('should return error after all retries fail', async () => {
      mockQuery.mockResolvedValue({ rows: [] });
      mockCreate.mockRejectedValue(new Error('Twilio error'));

      const result = await sendSMS({
        to: '+1234567890',
        body: 'Real message',
        salonId: 'salon-123',
      });

      expect(mockCreate).toHaveBeenCalledTimes(3);
      expect(result).toEqual({ error: 'Failed after retries' });
    });

    it('should return error when no sender configured', async () => {
      delete process.env.TWILIO_WHATSAPP_NUMBER;
      mockQuery.mockResolvedValue({ rows: [] });

      const result = await sendSMS({
        to: '+1234567890',
        body: 'Real message',
        salonId: 'salon-123',
      });

      // When no sender is configured, the function returns an error object
      expect(result).toEqual({ error: 'Failed after retries' });
    });
  });
});
