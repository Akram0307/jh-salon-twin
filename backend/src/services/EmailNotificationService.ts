import sgMail from '@sendgrid/mail';
import { query } from '../config/db';

import logger from '../config/logger';
import type { SendGridMailData } from '../types/serviceTypes';
import { getErrorMessage } from '../types/routeTypes';
const log = logger.child({ module: 'email_notification_service' });

// Initialize SendGrid with API key
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

export type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  salonId?: string;
  templateId?: string;
  dynamicTemplateData?: Record<string, unknown>;
};

export type EmailResult = {
  success: boolean;
  messageId?: string;
  error?: string;
  skipped?: boolean;
  reason?: string;
};

async function getSalonEmailConfig(salonId: string): Promise<{ fromEmail: string; fromName: string }> {
  try {
    const res = await query(
      `SELECT config_value FROM salon_config WHERE salon_id = $1 AND config_key = 'email_settings'`,
      [salonId]
    );
    if (res.rows.length) {
      const config = JSON.parse(res.rows[0].config_value);
      return {
        fromEmail: config.from_email || process.env.DEFAULT_FROM_EMAIL || 'noreply@salonos.ai',
        fromName: config.from_name || process.env.DEFAULT_FROM_NAME || 'SalonOS'
      };
    }
  } catch (e) {
    log.error({ err: e }, '[EmailNotificationService] getSalonEmailConfig error');
  }
  return {
    fromEmail: process.env.DEFAULT_FROM_EMAIL || 'noreply@salonos.ai',
    fromName: process.env.DEFAULT_FROM_NAME || 'SalonOS'
  };
}

export async function sendEmail(payload: EmailPayload): Promise<EmailResult> {
  // Check if we're in test mode
  if (process.env.TEST_MODE === 'true') {
    log.info({ to: payload.to, subject: payload.subject }, '[EmailNotificationService] TEST_MODE: Skipping email send');
    return { success: true, skipped: true, reason: 'test_mode' };
  }

  // Check if SendGrid is configured
  if (!process.env.SENDGRID_API_KEY) {
    log.error('[EmailNotificationService] SENDGRID_API_KEY not configured');
    return { success: false, error: 'sendgrid_not_configured' };
  }

  try {
    let fromEmail = payload.from;
    let fromName = 'SalonOS';

    // Get salon-specific email configuration if salonId is provided
    if (payload.salonId) {
      const salonConfig = await getSalonEmailConfig(payload.salonId);
      fromEmail = fromEmail || salonConfig.fromEmail;
      fromName = salonConfig.fromName;
    } else {
      fromEmail = fromEmail || process.env.DEFAULT_FROM_EMAIL || 'noreply@salonos.ai';
      fromName = process.env.DEFAULT_FROM_NAME || 'SalonOS';
    }

    const msg: SendGridMailData = {
      to: payload.to,
      from: {
        email: fromEmail,
        name: fromName
      },
      subject: payload.subject,
      html: payload.html,
    };

    if (payload.text) {
      msg.text = payload.text;
    }

    // If using a dynamic template
    if (payload.templateId) {
      msg.templateId = payload.templateId;
      if (payload.dynamicTemplateData) {
        msg.dynamicTemplateData = payload.dynamicTemplateData;
      }
    }

    const [response] = await sgMail.send(msg);
    
    log.info({
      to: payload.to,
      subject: payload.subject,
      messageId: response.headers['x-message-id']
    }, '[EmailNotificationService] Email sent successfully');

    return {
      success: true,
      messageId: response.headers['x-message-id'] as string
    };
  } catch (error: unknown) {
    const errMsg = getErrorMessage(error);
    const sgResponse = error instanceof Error && 'response' in error
      ? (error as Error & { response: { body: unknown } }).response.body
      : undefined;
    log.error({
      to: payload.to,
      subject: payload.subject,
      error: errMsg,
      response: sgResponse
    }, '[EmailNotificationService] Failed to send email');

    return {
      success: false,
      error: errMsg || 'send_failed'
    };
  }
}

export async function sendTemplateEmail(
  to: string,
  templateName: string,
  salonId: string,
  dynamicData: Record<string, unknown> = {}
): Promise<EmailResult> {
  try {
    // Get template from database
    const templateRes = await query(
      `SELECT * FROM notification_templates WHERE salon_id = $1 AND name = $2 AND type = 'email' AND is_active = true LIMIT 1`,
      [salonId, templateName]
    );

    if (!templateRes.rows.length) {
      log.error({ templateName, salonId }, '[EmailNotificationService] Template not found');
      return { success: false, error: 'template_not_found' };
    }

    const template = templateRes.rows[0];
    
    // Replace variables in template body
    let html = template.body;
    let subject = template.subject || 'Notification from SalonOS';

    // Replace variables in both subject and body
    for (const [key, value] of Object.entries(dynamicData)) {
      const placeholder = `{{${key}}}`;
      html = html.replace(new RegExp(placeholder, 'g'), String(value));
      subject = subject.replace(new RegExp(placeholder, 'g'), String(value));
    }

    // Send email
    return await sendEmail({
      to,
      subject,
      html,
      salonId,
      templateId: template.id
    });
  } catch (error: unknown) {
    log.error({ err: error }, '[EmailNotificationService] sendTemplateEmail error');
    return { success: false, error: getErrorMessage(error) };
  }
}

export default {
  sendEmail,
  sendTemplateEmail
};
