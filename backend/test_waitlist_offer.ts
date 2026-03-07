import 'dotenv/config'
import { sendWaitlistOffer } from './src/services/TwilioWhatsAppService'

async function run() {
  const to = process.env.TEST_TO_NUMBER
  const salonId = process.env.SALON_ID

  if (!to) {
    throw new Error('Missing TEST_TO_NUMBER in .env for WhatsApp test')
  }

  if (!salonId) {
    throw new Error('Missing SALON_ID in .env for test')
  }

  await sendWaitlistOffer(
    salonId,
    to,
    'Haircut',
    '2026-03-06 14:00',
    'test-offer-123'
  )

  console.log('✅ Test offer sent')
}

run()
