
import logger from '../config/logger';
import twilio from 'twilio'
import { query } from '../config/db'

const accountSid = process.env.TWILIO_ACCOUNT_SID as string
const authToken = process.env.TWILIO_AUTH_TOKEN as string
const defaultSender = process.env.TWILIO_WHATSAPP_NUMBER as string

const client = twilio(accountSid, authToken)

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function resolveSenderNumber(salonId: string): Promise<string> {
  try {
    const result = await query(
      `SELECT whatsapp_sender_number FROM salons WHERE id=$1 LIMIT 1`,
      [salonId]
    )
    if (result.rows.length && result.rows[0].whatsapp_sender_number) {
      return result.rows[0].whatsapp_sender_number
    }
  } catch (e) {
    // fallthrough to default
  }
  if (!defaultSender) console.warn('[SMS] No Twilio sender configured - SMS features disabled')
  return defaultSender
}

export type SMSPayload = {
  to: string
  body: string
  salonId?: string
}

export async function sendSMS(payload: SMSPayload) {
  const { to, body, salonId } = payload
  const testNumbers = ['+10000000000', '+15555555555']
  const isTest = !to || testNumbers.some(n => to.startsWith(n))
  if (isTest) {
    logger.info({ to, body }, '[SMS SIMULATION]')
    return { simulated: true, sid: 'SIMULATED' }
  }
  const sender = await resolveSenderNumber(salonId || 'default')
  const delays = [500, 1000, 2000]
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const message = await client.messages.create({
        from: `whatsapp:${sender}`,
        to: `whatsapp:${to}`,
        body,
      })
      logger.info({ to, sid: message.sid, status: message.status }, '[SMS SENT]')
      return { sid: message.sid, status: message.status }
    } catch (error) {
      logger.error({ attempt: attempt + 1, err: error }, '[SMS ERROR]')
      if (attempt < 2) await sleep(delays[attempt])
    }
  }
  logger.error({ to }, '[SMS FAILED] after retries')
  return { error: 'Failed after retries' }
}
