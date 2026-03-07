const UUID_REGEX = /^[0-9a-fA-F-]{36}$/;
import { query } from '../config/db'

export type ClientState =
  | 'NEW_CLIENT'
  | 'RETURNING_CLIENT'
  | 'UPCOMING_BOOKING'
  | 'WAITLISTED'
  | 'DORMANT'

export interface ClientStateResult {
  state: ClientState
  upcomingAppointmentId?: string
}

export class ClientStateResolver {
  static async resolve(clientId: string, salonId: string): Promise<ClientStateResult> {

    let clientRes

    // Normalize Twilio WhatsApp sender format: "whatsapp:+15551234567"
    if (clientId.startsWith('whatsapp:')) {
      const phone = clientId.replace('whatsapp:','');

      clientRes = await query(
        `SELECT id, last_visit FROM clients WHERE phone=$1 AND salon_id=$2`,
        [phone, salonId]
      )

      if (clientRes.rows.length > 0) {
        clientId = clientRes.rows[0].id
      }
    } else {
      clientRes = await query(
        `SELECT id, last_visit FROM clients WHERE id=$1 AND salon_id=$2`,
        [clientId, salonId]
      )
    }

    if (clientRes.rows.length === 0) {
      return { state: 'NEW_CLIENT' }
    }

    const upcoming = await query(
      `SELECT id FROM appointments
       WHERE client_id=$1 AND salon_id=$2
       AND status='SCHEDULED'
       AND appointment_time > NOW()
       ORDER BY appointment_time ASC
       LIMIT 1`,
      [clientId, salonId]
    )

    if (upcoming.rows.length > 0) {
      return {
        state: 'UPCOMING_BOOKING',
        upcomingAppointmentId: upcoming.rows[0].id
      }
    }

    const waitlist = await query(
      `SELECT id FROM waitlist
       WHERE client_id=$1 AND salon_id=$2
       LIMIT 1`,
      [clientId, salonId]
    )

    if (waitlist.rows.length > 0) {
      return { state: 'WAITLISTED' }
    }

    const lastVisit = clientRes.rows[0].last_visit

    if (lastVisit) {
      const dormant = await query(
        `SELECT NOW() - $1::timestamptz > INTERVAL '60 days' as dormant`,
        [lastVisit]
      )

      if (dormant.rows[0].dormant) {
        return { state: 'DORMANT' }
      }

      return { state: 'RETURNING_CLIENT' }
    }

    return { state: 'NEW_CLIENT' }
  }
}
