import sgMail from '@sendgrid/mail';
import { query } from '../config/db';

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
  dynamicTemplateData?: Record<string, any>;
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
    console.error('[EmailNotificationService] getSalonEmailConfig error', e);
  }
  return {
    fromEmail: process.env.DEFAULT_FROM_EMAIL || 'noreply@salonos.ai',
    fromName: process.env.DEFAULT_FROM_NAME || 'SalonOS'
  };
}

export async function sendEmail(payload: EmailPayload): Promise<EmailResult> {
  // Check if we're in test mode
  if (process.env.TEST_MODE === 'true') {
    console.log('[EmailNotificationService] TEST_MODE: Skipping email send', { to: payload.to, subject: payload.subject });
    return { success: true, skipped: true, reason: 'test_mode' };
  }

  // Check if SendGrid is configured
  if (!process.env.SENDGRID_API_KEY) {
    console.error('[EmailNotificationService] SENDGRID_API_KEY not configured');
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

    const msg: any = {
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
    
    console.log('[EmailNotificationService] Email sent successfully', {
      to: payload.to,
      subject: payload.subject,
      messageId: response.headers['x-message-id']
    });

    return {
      success: true,
      messageId: response.headers['x-message-id'] as string
    };
  } catch (error: any) {
    console.error('[EmailNotificationService] Failed to send email', {
      to: payload.to,
      subject: payload.subject,
      error: error.message,
      response: error.response?.body
    });

    return {
      success: false,
      error: error.message || 'send_failed'
    };
  }
}

export async function sendTemplateEmail(
  to: string,
  templateName: string,
  salonId: string,
  dynamicData: Record<string, any> = {}
): Promise<EmailResult> {
  try {
    // Get template from database
    const templateRes = await query(
      `SELECT * FROM notification_templates WHERE salon_id = $1 AND name = $2 AND type = 'email' AND is_active = true LIMIT 1`,
      [salonId, templateName]
    );

    if (!templateRes.rows.length) {
      console.error('[EmailNotificationService] Template not found', { templateName, salonId });
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
  } catch (error: any) {
    console.error('[EmailNotificationService] sendTemplateEmail error', error);
    return { success: false, error: error.message };
  }
}

export default {
  sendEmail,
  sendTemplateEmail
};
