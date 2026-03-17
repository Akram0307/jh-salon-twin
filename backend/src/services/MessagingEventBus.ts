
import logger from '../config/logger';
logger.info('MessagingEventBus initialized')
export type MessagingEvent = {
  type: string;
  salon_id: string;
  payload: any;
};

type Handler = (event: MessagingEvent) => Promise<void> | void;

export class MessagingEventBus {
  private handlers: Map<string, Handler[]> = new Map();

  subscribe(eventType: string, handler: Handler) {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler);
  }

  async publish(event: MessagingEvent) {
    const handlers = this.handlers.get(event.type) || [];
    for (const handler of handlers) {
      await handler(event);
    }
  }
}

export const messagingEventBus = new MessagingEventBus();
