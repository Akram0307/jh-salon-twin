import { Request, Response } from 'express'
import { markClaimed } from '../repositories/WaitlistOfferRepository'
import { IntentRouter } from '../services/IntentRouter'
import { ClientStateResolver } from '../services/ClientStateResolver'
import { ConversationContextStore } from '../services/ConversationContextStore'
import { messagingOrchestrator } from '../services/MessagingOrchestrator'
import { query } from '../config/db'

export async function handleTwilioWebhook(req: Request, res: Response) {

  const body: string = req.body?.Body || '' || ''
  const rawFrom: string = req.body?.From || '' || ''
  const rawTo: string = req.body?.To || '' || ''

  const phone = rawFrom.replace('whatsapp:', '')
  const toNumber = rawTo.replace('whatsapp:', '')

  const salonLookup = await query(
    `SELECT id FROM salons WHERE whatsapp_sender_number=$1 LIMIT 1`,
    [toNumber]
  )

  if (salonLookup.rows.length === 0) {
    return res.status(404).send('Salon not configured for this WhatsApp number')
  }

  const salonId = salonLookup.rows[0].id

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

    return res.send('✅ Slot confirmed. Your appointment is booked.')
  }

  if (body.startsWith('DECLINE_')) {

    return res.send('👍 No problem. We will offer the slot to the next client.')
  }

  const intent = IntentRouter.parse(body)

  const state = clientId
    ? await ClientStateResolver.resolve(clientId, salonId)
    : { state: 'NEW_CLIENT' }

  if (clientId) {

    await ConversationContextStore.updateContext(clientId, {
      salon_id: salonId,
      last_intent: intent,
      pending_action: intent,
      conversation_state: state.state
    })

    await messagingOrchestrator.handleIncomingMessage({
      salon_id: salonId,
      client_id: clientId,
      phone,
      message: body
    })
  }

  return res.send(`Intent detected: ${intent} | Client state: ${state.state}`)
}

export const twilioWebhook = handleTwilioWebhook
