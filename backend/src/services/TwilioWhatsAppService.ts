if (process.env.TEST_MODE === 'true') { module.exports.resolveSenderNumber = async () => 'whatsapp:+10000000000'; }
import 'dotenv/config'
import twilio from 'twilio'
import { query } from '../config/db'

console.log('TwilioWhatsAppService initialized')

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
    throw new Error('Salon sender number not configured')
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
    console.log('[SIMULATION] Skipping Twilio send for test number:', phone)
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

      console.log('✅ Waitlist offer sent', { offerId, phone, sid: message.sid })
      return message

    } catch (error) {

      console.error('Twilio send attempt failed', attempt + 1, error)

      if (attempt < 2) {
        await sleep(delays[attempt])
      }
    }
  }

  console.error('❌ Twilio failed after retries', { offerId, phone })
  return null
}
