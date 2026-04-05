
import logger from '../config/logger';
logger.info('ConversationManager initialized')
import { IntentRouter, Intent } from './IntentRouter'
import { ConversationContextStore } from './ConversationContextStore'
import { ClientStateResolver } from './ClientStateResolver'
import { UpsellService } from './UpsellService'
import { WaitlistService } from './WaitlistService'
import { messagingEventBus } from './MessagingEventBus'

export interface IncomingMessageInput {
  salonId: string
  clientPhone: string
  clientId: string
  messageText: string
}

interface ConversationMemory {
  preferred_service_id?: string
  preferred_staff_id?: string
  visit_frequency?: number
  last_intent?: Intent
}

export class ConversationManager {

  async handleIncomingMessage(input: IncomingMessageInput) {
    const { salonId, clientId, clientPhone, messageText } = input

    const clientState = await ClientStateResolver.resolve(clientId, salonId)

    const existingContext = await ConversationContextStore.getContext(clientId)

    const intent: Intent = IntentRouter.parse(messageText)

    const memory: ConversationMemory = {
      preferred_service_id: existingContext?.last_service_id || undefined,
      preferred_staff_id: existingContext?.last_staff_id || undefined,
      last_intent: intent
    }

    await ConversationContextStore.updateContext(clientId, {
      salon_id: salonId,
      last_intent: intent,
      pending_action: null,
      last_service_id: memory.preferred_service_id || null,
      last_staff_id: memory.preferred_staff_id || null,
      conversation_state: JSON.stringify(memory)
    })

    await this.routeIntent({
      salonId,
      clientId,
      clientPhone,
      intent,
      clientState: clientState.state
    })
  }

  private async routeIntent(params: {
    salonId: string
    clientId: string
    clientPhone: string
    intent: Intent
    clientState: string
  }) {
    const { salonId, clientId, clientPhone, intent } = params

    switch (intent) {
      case 'BOOK_APPOINTMENT':
        await messagingEventBus.publish({
          type: 'BOOKING_FLOW_START',
          salon_id: salonId,
          payload: {
            client_id: clientId,
            phone: clientPhone
          }
        })
        break

      case 'RESCHEDULE':
        await messagingEventBus.publish({
          type: 'RESCHEDULE_REQUESTED',
          salon_id: salonId,
          payload: {
            client_id: clientId,
            phone: clientPhone
          }
        })
        break

      case 'CANCEL':
        await messagingEventBus.publish({
          type: 'CANCEL_REQUESTED',
          salon_id: salonId,
          payload: {
            client_id: clientId,
            phone: clientPhone
          }
        })
        break

      case 'ADD_SERVICE':
        await messagingEventBus.publish({
          type: 'UPSELL_REQUESTED',
          salon_id: salonId,
          payload: {
            client_id: clientId,
            phone: clientPhone
          }
        })
        break

      case 'WAITLIST_REPLY':
        await messagingEventBus.publish({
          type: 'WAITLIST_RESPONSE',
          salon_id: salonId,
          payload: {
            client_id: clientId,
            phone: clientPhone
          }
        })
        break

      default:
        await messagingEventBus.publish({
          type: 'GENERAL_QUERY',
          salon_id: salonId,
          payload: {
            client_id: clientId,
            phone: clientPhone
          }
        })
    }
  }

  async triggerRebookingReminder(params: {
    salonId: string
    clientId: string
    lastServiceId: string
  }) {
    await messagingEventBus.publish({
      type: 'REBOOKING_REMINDER',
      salon_id: params.salonId,
      payload: {
        client_id: params.clientId,
        service_id: params.lastServiceId
      }
    })
  }

  async triggerUpsellSuggestion(params: {
    salonId: string
    clientId: string
    baseServiceId: string
  }) {
    const upsells = await UpsellService.getUpsells(params.baseServiceId)

    if (!upsells || upsells.length === 0) return

    await messagingEventBus.publish({
      type: 'UPSELL_SUGGESTION',
      salon_id: params.salonId,
      payload: {
        client_id: params.clientId,
        upsell_services: upsells
      }
    })
  }

  async triggerWaitlistProcessing(appointmentTime: string | Date) {
    await WaitlistService.processCancellation(appointmentTime)
  }
}

export const conversationManager = new ConversationManager()
