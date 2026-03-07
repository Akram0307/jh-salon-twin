export type DomainEvent = {
  type: string
  salon_id: string
  entity_id?: string
  payload?: any
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
        console.error("DomainEventBus handler error", event.type, err)
      }
    }
  }
}

export const domainEventBus = new DomainEventBus()
