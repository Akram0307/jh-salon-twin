import { domainEventBus } from './DomainEventBus'

export class RevenueIntelligenceOrchestrator {
  constructor() {
    this.register()
  }

  register() {
    domainEventBus.subscribe('appointment.created', async (event) => {
      console.log('Orchestrator: appointment created', event.entity_id)
    })

    domainEventBus.subscribe('transaction.completed', async (event) => {
      console.log('Orchestrator: transaction completed', event.entity_id)
    })

    domainEventBus.subscribe('slot.idle_detected', async (event) => {
      console.log('Orchestrator: idle slot detected', event.payload)
    })
  }
}

export const revenueOrchestrator = new RevenueIntelligenceOrchestrator()
