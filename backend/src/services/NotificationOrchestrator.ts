import { sendSMS } from './SMSNotificationService';
import { sendEmail, sendTemplateEmail, EmailResult } from './EmailNotificationService';
import { query } from '../config/db';
import { NotificationLogRepository } from '../repositories/NotificationLogRepository';

export type ConfirmationPayload = {
  appointmentId: string;
  salonId: string;
  clientId: string;
  serviceName: string;
  staffName: string;
  dateTime: string;
};

export type ReminderPayload = {
  appointmentId: string;
  salonId: string;
  clientId: string;
  serviceName: string;
  dateTime: string;
};

export type NotificationPayload = {
  salonId: string;
  userId: string;
  userType: 'client' | 'staff' | 'owner';
  type: 'email' | 'sms' | 'push';
  templateName?: string;
  subject?: string;
  content?: string;
  recipient: string;
  dynamicData?: Record<string, any>;
};

async function getClientPhone(clientId: string): Promise<string | null> {
  if (process.env.TEST_MODE === 'true') return '+10000000000';
  try {
    const res = await query('SELECT phone FROM clients WHERE id=$1 LIMIT 1', [clientId]);
    if (res.rows.length) return res.rows[0].phone as string;
  } catch (e) {
    console.error('[NotificationOrchestrator] getClientPhone error', e);
  }
  return null;
}

async function getClientEmail(clientId: string): Promise<string | null> {
  if (process.env.TEST_MODE === 'true') return 'test@example.com';
  try {
    const res = await query('SELECT email FROM clients WHERE id=$1 LIMIT 1', [clientId]);
    if (res.rows.length) return res.rows[0].email as string;
  } catch (e) {
    console.error('[NotificationOrchestrator] getClientEmail error', e);
  }
  return null;
}

async function getSalonName(salonId: string): Promise<string> {
  if (process.env.TEST_MODE === 'true') return 'SalonOS Test Salon';
  try {
    const res = await query('SELECT name FROM salons WHERE id=$1 LIMIT 1', [salonId]);
    if (res.rows.length) return res.rows[0].name as string;
  } catch (e) {
    // ignore
  }
  return 'Salon';
}

async function getUserNotificationPreferences(
  userId: string,
  userType: 'client' | 'staff' | 'owner'
): Promise<{ email: boolean; sms: boolean; push: boolean }> {
  try {
    const res = await query(
      'SELECT notification_preferences FROM user_settings WHERE user_id = $1 AND user_type = $2 LIMIT 1',
      [userId, userType]
    );
    if (res.rows.length && res.rows[0].notification_preferences) {
      return res.rows[0].notification_preferences;
    }
  } catch (e) {
    console.error('[NotificationOrchestrator] getUserNotificationPreferences error', e);
  }
  // Default preferences
  return { email: true, sms: true, push: true };
}

// SMS Notification Methods
export async function sendConfirmationSMS(payload: ConfirmationPayload) {
  const phone = await getClientPhone(payload.clientId);
  if (!phone) {
    console.log('[NotificationOrchestrator] No phone for client', payload.clientId);
    return { skipped: true, reason: 'no_phone' };
  }
  const salonName = await getSalonName(payload.salonId);
  const body = `Hi! Your appointment at ${salonName} is confirmed.\nService: ${payload.serviceName}\nStylist: ${payload.staffName}\nDate/Time: ${payload.dateTime}\nSee you soon!`;
  const result = await sendSMS({ to: phone, body, salonId: payload.salonId });
  console.log('[NotificationOrchestrator] Confirmation result', { appointmentId: payload.appointmentId, result });
  
  // Log notification
  await NotificationLogRepository.create({
    salon_id: payload.salonId,
    user_id: payload.clientId,
    user_type: 'client',
    type: 'sms',
    recipient: phone,
    content: body,
    status: ('error' in result) ? 'failed' : 'sent'
  });
  
  return result;
}

export async function sendReminderSMS(payload: ReminderPayload) {
  const phone = await getClientPhone(payload.clientId);
  if (!phone) {
    console.log('[NotificationOrchestrator] No phone for client', payload.clientId);
    return { skipped: true, reason: 'no_phone' };
  }
  const salonName = await getSalonName(payload.salonId);
  const body = `Reminder: You have an appointment at ${salonName} soon.\nService: ${payload.serviceName}\nDate/Time: ${payload.dateTime}\nReply if you need to reschedule.`;
  const result = await sendSMS({ to: phone, body, salonId: payload.salonId });
  console.log('[NotificationOrchestrator] Reminder result', { appointmentId: payload.appointmentId, result });
  
  // Log notification
  await NotificationLogRepository.create({
    salon_id: payload.salonId,
    user_id: payload.clientId,
    user_type: 'client',
    type: 'sms',
    recipient: phone,
    content: body,
    status: ('error' in result) ? 'failed' : 'sent'
  });
  
  return result;
}

// Email Notification Methods
export async function sendConfirmationEmail(payload: ConfirmationPayload): Promise<EmailResult> {
  const email = await getClientEmail(payload.clientId);
  if (!email) {
    console.log('[NotificationOrchestrator] No email for client', payload.clientId);
    return { success: false, skipped: true, reason: 'no_email' };
  }
  
  const salonName = await getSalonName(payload.salonId);
  const subject = `Appointment Confirmed - ${salonName}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Appointment Confirmed!</h2>
      <p>Hi! Your appointment at <strong>${salonName}</strong> has been confirmed.</p>
      <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Service:</strong> ${payload.serviceName}</p>
        <p><strong>Stylist:</strong> ${payload.staffName}</p>
        <p><strong>Date/Time:</strong> ${payload.dateTime}</p>
      </div>
      <p>We look forward to seeing you!</p>
      <p style="color: #666; font-size: 12px;">If you need to reschedule, please contact us.</p>
    </div>
  `;
  
  const result = await sendEmail({ to: email, subject, html, salonId: payload.salonId });
  console.log('[NotificationOrchestrator] Email confirmation result', { appointmentId: payload.appointmentId, result });
  
  // Log notification
  await NotificationLogRepository.create({
    salon_id: payload.salonId,
    user_id: payload.clientId,
    user_type: 'client',
    type: 'email',
    recipient: email,
    content: html,
    status: ('error' in result) ? 'failed' : 'sent'
  });
  
  return result;
}

export async function sendReminderEmail(payload: ReminderPayload): Promise<EmailResult> {
  const email = await getClientEmail(payload.clientId);
  if (!email) {
    console.log('[NotificationOrchestrator] No email for client', payload.clientId);
    return { success: false, skipped: true, reason: 'no_email' };
  }
  
  const salonName = await getSalonName(payload.salonId);
  const subject = `Appointment Reminder - ${salonName}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Appointment Reminder</h2>
      <p>Hi! This is a reminder about your upcoming appointment at <strong>${salonName}</strong>.</p>
      <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Service:</strong> ${payload.serviceName}</p>
        <p><strong>Date/Time:</strong> ${payload.dateTime}</p>
      </div>
      <p>Please reply if you need to reschedule.</p>
    </div>
  `;
  
  const result = await sendEmail({ to: email, subject, html, salonId: payload.salonId });
  console.log('[NotificationOrchestrator] Email reminder result', { appointmentId: payload.appointmentId, result });
  
  // Log notification
  await NotificationLogRepository.create({
    salon_id: payload.salonId,
    user_id: payload.clientId,
    user_type: 'client',
    type: 'email',
    recipient: email,
    content: html,
    status: ('error' in result) ? 'failed' : 'sent'
  });
  
  return result;
}

// Generic notification dispatcher
export async function dispatchNotification(payload: NotificationPayload) {
  // Check user preferences
  const preferences = await getUserNotificationPreferences(payload.userId, payload.userType);
  
  if (payload.type === 'email' && !preferences.email) {
    return { skipped: true, reason: 'email_disabled' };
  }
  if (payload.type === 'sms' && !preferences.sms) {
    return { skipped: true, reason: 'sms_disabled' };
  }
  if (payload.type === 'push' && !preferences.push) {
    return { skipped: true, reason: 'push_disabled' };
  }
  
  let result;
  
  if (payload.type === 'email') {
    if (payload.templateName) {
      result = await sendTemplateEmail(
        payload.recipient,
        payload.templateName,
        payload.salonId,
        payload.dynamicData || {}
      );
    } else {
      result = await sendEmail({
        to: payload.recipient,
        subject: payload.subject || 'Notification from SalonOS',
        html: payload.content || '',
        salonId: payload.salonId
      });
    }
  } else if (payload.type === 'sms') {
    result = await sendSMS({
      to: payload.recipient,
      body: payload.content || '',
      salonId: payload.salonId
    });
  } else {
    // Push notifications - placeholder for future implementation
    result = { success: false, error: 'push_not_implemented' };
  }
  
  // Log notification
  await NotificationLogRepository.create({
    salon_id: payload.salonId,
    user_id: payload.userId,
    user_type: payload.userType,
    type: payload.type,
    recipient: payload.recipient,
    content: payload.content || '',
    status: ('error' in result) ? 'failed' : 'sent'
  });
  
  return result;
}

// Appointment reminder automation
export async function dispatchReminderForAppointment(appointmentId: string) {
  try {
    const res = await query(
      `SELECT a.id, a.salon_id, a.client_id, a.appointment_time, s.name as service_name, st.name as staff_name
       FROM appointments a
       LEFT JOIN appointment_services aps ON a.id = aps.appointment_id
       LEFT JOIN services s ON aps.service_id = s.id
       LEFT JOIN staff st ON a.staff_id = st.id
       WHERE a.id=$1 LIMIT 1`,
      [appointmentId]
    );
    if (!res.rows.length) return { error: 'appointment_not_found' };
    
    const row = res.rows[0];
    const payload: ReminderPayload = {
      appointmentId: row.id,
      salonId: row.salon_id,
      clientId: row.client_id,
      serviceName: row.service_name || 'Service',
      dateTime: row.appointment_time
    };
    
    // Send both SMS and email reminders
    const smsResult = await sendReminderSMS(payload);
    const emailResult = await sendReminderEmail(payload);
    
    return {
      sms: smsResult,
      email: emailResult
    };
  } catch (e) {
    console.error('[NotificationOrchestrator] dispatchReminderForAppointment error', e);
    return { error: 'dispatch_failed' };
  }
}

// Send confirmation for both SMS and email
export async function sendAppointmentConfirmation(appointmentId: string) {
  try {
    const res = await query(
      `SELECT a.id, a.salon_id, a.client_id, a.appointment_time, s.name as service_name, st.name as staff_name
       FROM appointments a
       LEFT JOIN appointment_services aps ON a.id = aps.appointment_id
       LEFT JOIN services s ON aps.service_id = s.id
       LEFT JOIN staff st ON a.staff_id = st.id
       WHERE a.id=$1 LIMIT 1`,
      [appointmentId]
    );
    if (!res.rows.length) return { error: 'appointment_not_found' };
    
    const row = res.rows[0];
    const payload: ConfirmationPayload = {
      appointmentId: row.id,
      salonId: row.salon_id,
      clientId: row.client_id,
      serviceName: row.service_name || 'Service',
      staffName: row.staff_name || 'Staff',
      dateTime: row.appointment_time
    };
    
    // Send both SMS and email confirmations
    const smsResult = await sendConfirmationSMS(payload);
    const emailResult = await sendConfirmationEmail(payload);
    
    return {
      sms: smsResult,
      email: emailResult
    };
  } catch (e) {
    console.error('[NotificationOrchestrator] sendAppointmentConfirmation error', e);
    return { error: 'dispatch_failed' };
  }
}

export default {
  sendConfirmationSMS,
  sendReminderSMS,
  sendConfirmationEmail,
  sendReminderEmail,
  dispatchNotification,
  dispatchReminderForAppointment,
  sendAppointmentConfirmation
};
