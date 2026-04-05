
import logger from '../config/logger';
export type DomainEvent = {
  type: string
  salon_id: string
  entity_id?: string
  payload?: unknown
  created_at?: Date
}

type DomainHandler = (event: DomainEvent) => Promise<void> | void

export class DomainEventBus {
  private handlers: Map<string, DomainHandler[]> = new Map()

  subscribe(eventType: string, handler: DomainHandler) {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, [])
    }
    this.handlers.get(eventType)!.push(handler)
  }

  async publish(event: DomainEvent) {
    const handlers = this.handlers.get(event.type) || []
    for (const handler of handlers) {
      try {
        await handler(event)
      } catch (err) {
        logger.error({ eventType: event.type, err }, "DomainEventBus handler error")
      }
    }
  }
}

export const domainEventBus = new DomainEventBus()
