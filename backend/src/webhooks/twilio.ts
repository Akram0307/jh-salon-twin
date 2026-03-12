import { Request, Response } from 'express'
import { markClaimed } from '../repositories/WaitlistOfferRepository'
import { IntentRouter } from '../services/IntentRouter'
import { ClientStateResolver } from '../services/ClientStateResolver'
import { ConversationContextStore } from '../services/ConversationContextStore'
import { messagingOrchestrator } from '../services/MessagingOrchestrator'
import { query } from '../config/db'
import { SlotGenerator } from '../services/SlotGenerator'

export async function handleTwilioWebhook(req: Request, res: Response) {

  const body: string = req.body?.Body || '' || ''
  const rawFrom: string = req.body?.From || '' || ''
  const rawTo: string = req.body?.To || '' || ''

  const phone = rawFrom.replace('whatsapp:', '')
  const toNumber = rawTo.replace('whatsapp:', '')

  const salonLookup = await query(
    `SELECT id FROM salons WHERE whatsapp_sender_number=$1 OR whatsapp_sender_number=('whatsapp:'||$1) LIMIT 1`,
    [toNumber]
  )

  const salonId = (salonLookup.rows[0]?.id) || (process.env.SALON_ID as string)

  if (!salonId) {
  }

  let clientId: string | null = null

  const clientLookup = await query(
    `SELECT id FROM clients WHERE phone_number=$1 LIMIT 1`,
    [phone]
  )

  if (clientLookup.rows.length > 0) {
    clientId = clientLookup.rows[0].id
  }

  if (body.startsWith('CONFIRM_')) {

    const offerId = body.replace('CONFIRM_', '')
    await markClaimed(offerId)

    res.set('Content-Type','text/xml'); return res.send('<Response><Message>✅ Slot confirmed. Your appointment is booked.</Message></Response>')
  }

  if (body.startsWith('DECLINE_')) {

    res.set('Content-Type','text/xml'); return res.send('<Response><Message>👍 No problem. We will offer the slot to the next client.</Message></Response>')
  }

  const intent = IntentRouter.parse(body)

// ===== WhatsApp Smart Booking Upgrade =====
if (
  body.toLowerCase().includes('book') ||
  body.toLowerCase().includes('appointment') ||
  body.toLowerCase().includes('slot') ||
  intent === 'BOOK_APPOINTMENT'
) {
  try {
    const today = new Date().toISOString().split('T')[0]

    const serviceRes = await query(
      'SELECT id FROM services WHERE salon_id=$1 LIMIT 1',
      [salonId]
    )

    if (serviceRes.rows.length > 0) {
      const serviceId = serviceRes.rows[0].id

      const slots = await SlotGenerator.getAvailableSlots(
        salonId,
        serviceId,
        today
      )

      const topSlots = slots
        .slice(0, 3)
        .map((s: any) => s.time)
        .join(', ')

      res.set('Content-Type', 'text/xml')

      return res.send(
        `<Response><Message>✂️ We have availability today: ${topSlots}. Reply with your preferred time to confirm your booking.</Message></Response>`
      )
    }
  } catch (err) {
    console.error('Slot suggestion error', err)
  }
}
// ===== End Smart Booking Upgrade =====


  const state = clientId
    ? await ClientStateResolver.resolve(clientId, salonId)
    : { state: 'NEW_CLIENT' }

  if (true) {

    await ConversationContextStore.updateContext(clientId || phone, {
      salon_id: salonId,
      last_intent: intent,
      pending_action: intent,
      conversation_state: state.state
    })

    await messagingOrchestrator.handleIncomingMessage({
      salon_id: salonId,
      client_id: (clientId || phone),
      phone,
      message: body
    })
  }

  return res.send(`Intent detected: ${intent} | Client state: ${state.state}`)
}

export const twilioWebhook = handleTwilioWebhook
