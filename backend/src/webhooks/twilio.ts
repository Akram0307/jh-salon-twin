import { Request, Response } from 'express'
import twilio from 'twilio'
import { markClaimed } from '../repositories/WaitlistOfferRepository'
import { IntentRouter } from '../services/IntentRouter'
import { ClientStateResolver } from '../services/ClientStateResolver'
import { ConversationContextStore } from '../services/ConversationContextStore'
import { messagingOrchestrator } from '../services/MessagingOrchestrator'
import { query } from '../config/db'
import { SlotGenerator } from '../services/SlotGenerator'
import logger from '../config/logger'



function validateTwilioSignature(req: Request): boolean {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) {
    logger.error('[TWILIO] FATAL: TWILIO_AUTH_TOKEN is not configured');
    return false;
  }

  const signature = req.headers['x-twilio-signature'] as string | undefined;
  if (!signature) {
    logger.warn('[TWILIO] Missing X-Twilio-Signature header');
    return false;
  }

  const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
  const params = req.body;

  return twilio.validateRequest(authToken, signature, url, params);
}

/** Sanitize WhatsApp message body - strip HTML tags, limit length */
function sanitizeBody(raw: string): string {
  return raw
    .replace(/<[^>]*>/g, '')
    .replace(/[\x00-\x1F\x7F]/g, '')
    .slice(0, 2000);
}

/** Helper to send TwiML response */
function twimlResponse(message: string): { headers: Record<string, string>; body: string } {
  const escaped = message
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return {
    headers: { 'Content-Type': 'text/xml' },
    body: `<Response><Message>${escaped}</Message></Response>`
  };
}

export async function handleTwilioWebhook(req: Request, res: Response) {
  // SEC-005: Validate Twilio webhook signature
  if (!validateTwilioSignature(req)) {
    return res.status(403).send('Forbidden: Invalid webhook signature');
  }

  const rawBody: string = req.body?.Body || '';
  const body = sanitizeBody(rawBody);
  const rawFrom: string = req.body?.From || '';
  const rawTo: string = req.body?.To || '';

  const phone = rawFrom.replace('whatsapp:', '');
  const toNumber = rawTo.replace('whatsapp:', '');

  const salonLookup = await query(
    `SELECT id FROM salons WHERE whatsapp_sender_number=$1 OR whatsapp_sender_number=('whatsapp:'||$1) LIMIT 1`,
    [toNumber]
  );

  const salonId = salonLookup.rows[0]?.id || (process.env.SALON_ID as string);

  // S5-M3: Return proper TwiML error when salonId is missing
  if (!salonId) {
    const resp = twimlResponse('⚠️ Sorry, we could not identify your salon. Please contact support.');
    res.set('Content-Type', resp.headers['Content-Type']);
    return res.send(resp.body);
  }

  let clientId: string | null = null;

  const clientLookup = await query(
    `SELECT id FROM clients WHERE phone_number=$1 LIMIT 1`,
    [phone]
  );

  if (clientLookup.rows.length > 0) {
    clientId = clientLookup.rows[0].id;
  }

  if (body.startsWith('CONFIRM_')) {
    const offerId = body.replace('CONFIRM_', '');
    await markClaimed(offerId);
    const resp = twimlResponse('✅ Slot confirmed. Your appointment is booked.');
    res.set('Content-Type', resp.headers['Content-Type']);
    return res.send(resp.body);
  }

  if (body.startsWith('DECLINE_')) {
    const resp = twimlResponse('👍 No problem. We will offer the slot to the next client.');
    res.set('Content-Type', resp.headers['Content-Type']);
    return res.send(resp.body);
  }

  const intent = IntentRouter.parse(body);

  // ===== WhatsApp Smart Booking Upgrade =====
  if (
    body.toLowerCase().includes('book') ||
    body.toLowerCase().includes('appointment') ||
    body.toLowerCase().includes('slot') ||
    intent === 'BOOK_APPOINTMENT'
  ) {
    try {
      const today = new Date().toISOString().split('T')[0];

      const serviceRes = await query(
        'SELECT id FROM services WHERE salon_id=$1 LIMIT 1',
        [salonId]
      );

      if (serviceRes.rows.length > 0) {
        const serviceId = serviceRes.rows[0].id;

        const slots = await SlotGenerator.getAvailableSlots(salonId, serviceId, today);

        const topSlots = slots
          .slice(0, 3)
          .map((s: any) => s.time)
          .join(', ');

        const resp = twimlResponse(
          topSlots
            ? `✂️ We have availability today: ${topSlots}. Reply with your preferred time to confirm your booking.`
            : '📅 Sorry, no available slots for today. Please try again tomorrow.'
        );
        res.set('Content-Type', resp.headers['Content-Type']);
        return res.send(resp.body);
      }
    } catch (err) {
      logger.error({ err }, 'Slot suggestion error');
      const resp = twimlResponse('⚠️ Sorry, something went wrong finding slots. Please try again.');
      res.set('Content-Type', resp.headers['Content-Type']);
      return res.send(resp.body);
    }
  }
  // ===== End Smart Booking Upgrade =====

  const state = clientId
    ? await ClientStateResolver.resolve(clientId, salonId)
    : { state: 'NEW_CLIENT' };

  await ConversationContextStore.updateContext(clientId || phone, {
    salon_id: salonId,
    last_intent: intent,
    pending_action: intent,
    conversation_state: state.state
  });

  await messagingOrchestrator.handleIncomingMessage({
    salon_id: salonId,
    client_id: clientId || phone,
    phone,
    message: body
  });

  // S5-M3: Always return TwiML, never plain text
  const resp = twimlResponse(`Intent detected: ${intent} | Client state: ${state.state}`);
  res.set('Content-Type', resp.headers['Content-Type']);
  return res.send(resp.body);
}

export const twilioWebhook = handleTwilioWebhook
