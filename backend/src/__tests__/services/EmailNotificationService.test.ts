import { describe, it, expect, vi, beforeEach } from 'vitest';
import sgMail from '@sendgrid/mail';
import { query } from '../../config/db';

vi.mock('@sendgrid/mail', () => ({
  default: {
    setApiKey: vi.fn(),
    send: vi.fn(),
  },
}));

vi.mock('../../config/db', () => ({
  query: vi.fn(),
}));

import { sendEmail, sendTemplateEmail } from '../../services/EmailNotificationService';

describe('EmailNotificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SENDGRID_API_KEY = 'test-api-key';
    process.env.TEST_MODE = 'false';
  });

  describe('sendEmail', () => {
    it('should skip email in test mode', async () => {
      process.env.TEST_MODE = 'true';
      const payload = {
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      };

      const result = await sendEmail(payload);

      expect(result.success).toBe(true);
      expect(result.skipped).toBe(true);
      expect(result.reason).toBe('test_mode');
    });

    it('should return error if SendGrid not configured', async () => {
      delete process.env.SENDGRID_API_KEY;
      const payload = {
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      };

      const result = await sendEmail(payload);

      expect(result.success).toBe(false);
      expect(result.error).toBe('sendgrid_not_configured');
    });

    it('should send email successfully', async () => {
      const mockResponse = [{ headers: { 'x-message-id': 'test-id' } }];
      vi.mocked(sgMail.send).mockResolvedValue(mockResponse);
      const payload = {
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      };

      const result = await sendEmail(payload);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('test-id');
      expect(sgMail.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          subject: 'Test',
          html: '<p>Test</p>',
        })
      );
    });

    it('should handle SendGrid error', async () => {
      vi.mocked(sgMail.send).mockRejectedValue(new Error('SendGrid error'));
      const payload = {
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      };

      const result = await sendEmail(payload);

      expect(result.success).toBe(false);
      expect(result.error).toBe('SendGrid error');
    });

    it('should use salon-specific email config when salonId provided', async () => {
      const mockConfig = {
        from_email: 'salon@example.com',
        from_name: 'Salon',
      };
      vi.mocked(query).mockResolvedValue({
        rows: [{ config_value: JSON.stringify(mockConfig) }],
      });
      const mockResponse = [{ headers: { 'x-message-id': 'test-id' } }];
      vi.mocked(sgMail.send).mockResolvedValue(mockResponse);
      const payload = {
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
        salonId: 'salon-123',
      };

      const result = await sendEmail(payload);

      expect(result.success).toBe(true);
      expect(sgMail.send).toHaveBeenCalledWith(
        expect.objectContaining({
          from: {
            email: 'salon@example.com',
            name: 'Salon',
          },
        })
      );
    });
  });

  describe('sendTemplateEmail', () => {
    it('should return error if template not found', async () => {
      vi.mocked(query).mockResolvedValue({ rows: [] });

      const result = await sendTemplateEmail(
        'test@example.com',
        'test-template',
        'salon-123',
        { name: 'John' }
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('template_not_found');
    });

    it('should send template email successfully', async () => {
      const mockTemplate = {
        id: 'template-123',
        body: '<p>Hello {{name}}</p>',
        subject: 'Hello {{name}}',
      };
      vi.mocked(query).mockResolvedValue({ rows: [mockTemplate] });
      const mockResponse = [{ headers: { 'x-message-id': 'test-id' } }];
      vi.mocked(sgMail.send).mockResolvedValue(mockResponse);

      const result = await sendTemplateEmail(
        'test@example.com',
        'test-template',
        'salon-123',
        { name: 'John' }
      );

      expect(result.success).toBe(true);
      expect(sgMail.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          subject: 'Hello John',
          html: '<p>Hello John</p>',
        })
      );
    });

    it('should handle database error', async () => {
      vi.mocked(query).mockRejectedValue(new Error('Database error'));

      const result = await sendTemplateEmail(
        'test@example.com',
        'test-template',
        'salon-123',
        { name: 'John' }
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });
  });
});
