import { messagingEventBus } from './MessagingEventBus';
import { messageStateManager } from './MessageStateManager';
import { IntentRouter } from './IntentRouter';
import type { MessageStateRow } from '../types/serviceTypes';

export class MessagingOrchestrator {
  

  constructor() {
    
  }

  async handleIncomingMessage(input: {
    salon_id: string;
    client_id: string;
    phone: string;
    message: string;
  }) {
    const { salon_id, client_id, message } = input;

    const pending = await messageStateManager.getPendingByClient(client_id);

    if (pending.length > 0) {
      await this.handleReply(pending[0], message);
      return;
    }

    const intent = IntentRouter.parse(message);

    await messagingEventBus.publish({
      type: 'INTENT_DETECTED',
      salon_id,
      payload: {
        client_id,
        intent
      }
    });
  }

  async handleReply(state: MessageStateRow, message: string) {
    const normalized = message.trim().toUpperCase();

    if (normalized === 'YES') {
      await messagingEventBus.publish({
        type: 'CLIENT_CONFIRMED',
        salon_id: state.salon_id,
        payload: {
          state,
          reply: message
        }
      });

      await messageStateManager.markCompleted(state.id);
    }

    if (normalized === 'NO') {
      await messagingEventBus.publish({
        type: 'CLIENT_DECLINED',
        salon_id: state.salon_id,
        payload: {
          state,
          reply: message
        }
      });

      await messageStateManager.markExpired(state.id);
    }
  }
}

export const messagingOrchestrator = new MessagingOrchestrator();
