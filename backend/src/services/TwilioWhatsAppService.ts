
import logger from '../config/logger';
const log = logger.child({ module: 'twilio_whats_app_service' });
if (process.env.TEST_MODE === 'true') { module.exports.resolveSenderNumber = async () => 'whatsapp:+10000000000'; }
import 'dotenv/config'
import twilio from 'twilio'
import { query } from '../config/db'

log.info('TwilioWhatsAppService initialized')

const accountSid = process.env.TWILIO_ACCOUNT_SID as string
const authToken = process.env.TWILIO_AUTH_TOKEN as string
const templateSid = process.env.WAITLIST_TEMPLATE_SID as string

const client = twilio(accountSid, authToken)

function sleep(ms:number){
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function resolveSenderNumber(salonId: string): Promise<string> {

  const result = await query(
    `SELECT whatsapp_sender_number FROM salons WHERE id=$1 LIMIT 1`,
    [salonId]
  )

  if (result.rows.length === 0 || !result.rows[0].whatsapp_sender_number) {
    log.warn('Salon sender number not configured - WhatsApp features disabled')
  }

  return result.rows[0].whatsapp_sender_number
}

export async function sendWaitlistOffer(
  salonId: string,
  phone: string,
  serviceName: string,
  slotTime: string,
  offerId: string
) {

  if (!phone || phone === '+10000000000' || phone.startsWith('+100000')) {
    log.info({ data: phone }, '[SIMULATION] Skipping Twilio send for test number:')
    return { simulated: true }
  }

  const senderNumber = await resolveSenderNumber(salonId)

  const delays = [500, 1000, 2000]

  for (let attempt = 0; attempt < 3; attempt++) {
    try {

      const message = await client.messages.create({
        from: `whatsapp:${senderNumber}`,
        to: `whatsapp:${phone}`,
        contentSid: templateSid,
        contentVariables: JSON.stringify({
          "1": serviceName,
          "2": slotTime,
          "3": offerId
        })
      })

      log.info({ offerId, phone, sid: message.sid }, '✅ Waitlist offer sent')
      return message

    } catch (error) {

      log.error('Twilio send attempt failed'  + " " + attempt + 1  + " " + error)

      if (attempt < 2) {
        await sleep(delays[attempt])
      }
    }
  }

  log.error({ offerId, phone }, '❌ Twilio failed after retries')
  return null
}
