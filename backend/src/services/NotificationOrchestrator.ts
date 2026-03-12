import { sendSMS } from './SMSNotificationService'
import { query } from '../config/db'

export type ConfirmationPayload = {
  appointmentId: string
  salonId: string
  clientId: string
  serviceName: string
  staffName: string
  dateTime: string
}

export type ReminderPayload = {
  appointmentId: string
  salonId: string
  clientId: string
  serviceName: string
  dateTime: string
}

async function getClientPhone(clientId: string): Promise<string | null> {
  if (process.env.TEST_MODE === 'true') return '+10000000000'
  try {
    const res = await query(`SELECT phone FROM clients WHERE id=$1 LIMIT 1`, [clientId])
    if (res.rows.length) return res.rows[0].phone as string
  } catch (e) {
    console.error('[NotificationOrchestrator] getClientPhone error', e)
  }
  return null
}

async function getSalonName(salonId: string): Promise<string> {
  if (process.env.TEST_MODE === 'true') return 'SalonOS Test Salon'
  try {
    const res = await query(`SELECT name FROM salons WHERE id=$1 LIMIT 1`, [salonId])
    if (res.rows.length) return res.rows[0].name as string
  } catch (e) {
    // ignore
  }
  return 'Salon'
}

export async function sendConfirmationSMS(payload: ConfirmationPayload) {
  const phone = await getClientPhone(payload.clientId)
  if (!phone) {
    console.log('[NotificationOrchestrator] No phone for client', payload.clientId)
    return { skipped: true, reason: 'no_phone' }
  }
  const salonName = await getSalonName(payload.salonId)
  const body = `Hi! Your appointment at ${salonName} is confirmed.\nService: ${payload.serviceName}\nStylist: ${payload.staffName}\nDate/Time: ${payload.dateTime}\nSee you soon!`
  const result = await sendSMS({ to: phone, body, salonId: payload.salonId })
  console.log('[NotificationOrchestrator] Confirmation result', { appointmentId: payload.appointmentId, result })
  return result
}

export async function sendReminderSMS(payload: ReminderPayload) {
  const phone = await getClientPhone(payload.clientId)
  if (!phone) {
    console.log('[NotificationOrchestrator] No phone for client', payload.clientId)
    return { skipped: true, reason: 'no_phone' }
  }
  const salonName = await getSalonName(payload.salonId)
  const body = `Reminder: You have an appointment at ${salonName} soon.\nService: ${payload.serviceName}\nDate/Time: ${payload.dateTime}\nReply if you need to reschedule.`
  const result = await sendSMS({ to: phone, body, salonId: payload.salonId })
  console.log('[NotificationOrchestrator] Reminder result', { appointmentId: payload.appointmentId, result })
  return result
}

export async function dispatchReminderForAppointment(appointmentId: string) {
  try {
    const res = await query(
      `SELECT a.id, a.salon_id, a.client_id, a.appointment_time, s.name as service_name
       FROM appointments a
       LEFT JOIN appointment_services aps ON a.id = aps.appointment_id
       LEFT JOIN services s ON aps.service_id = s.id
       WHERE a.id=$1 LIMIT 1`,
      [appointmentId]
    )
    if (!res.rows.length) return { error: 'appointment_not_found' }
    const row = res.rows[0]
    return await sendReminderSMS({
      appointmentId: row.id,
      salonId: row.salon_id,
      clientId: row.client_id,
      serviceName: row.service_name || 'Service',
      dateTime: row.appointment_time
    })
  } catch (e) {
    console.error('[NotificationOrchestrator] dispatchReminderForAppointment error', e)
    return { error: 'dispatch_failed' }
  }
}
