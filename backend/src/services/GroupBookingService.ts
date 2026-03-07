import { pool } from '../config/db'
import crypto from 'crypto'

export class GroupBookingService {

  static async createGroupBooking(data: {
    salon_id: string
    client_ids: string[]
    staff_id?: string
    appointment_time: string
    services: { service_id: string; base_price: number; charged_price?: number }[]
  }) {

    const client = await pool.connect()

    const groupId = crypto.randomUUID()

    try {

      await client.query('BEGIN')

      const appointments = []

      for (const clientId of data.client_ids) {

        const apptRes = await client.query(
          `INSERT INTO appointments
          (salon_id, client_id, staff_id, appointment_time, status, appointment_group_id)
          VALUES ($1,$2,$3,$4,'SCHEDULED',$5)
          RETURNING *`,
          [
            data.salon_id,
            clientId,
            data.staff_id,
            data.appointment_time,
            groupId
          ]
        )

        const appointment = apptRes.rows[0]

        for (const svc of data.services) {

          await client.query(
            `INSERT INTO appointment_services
            (appointment_id, service_id, base_price, charged_price)
            VALUES ($1,$2,$3,$4)`,
            [
              appointment.id,
              svc.service_id,
              svc.base_price,
              svc.charged_price || svc.base_price
            ]
          )
        }

        appointments.push(appointment)
      }

      await client.query('COMMIT')

      return {
        group_id: groupId,
        appointments
      }

    } catch (err) {

      await client.query('ROLLBACK')
      throw err

    } finally {

      client.release()

    }
  }
}
