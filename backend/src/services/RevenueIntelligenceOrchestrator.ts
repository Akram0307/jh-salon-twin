
import logger from '../config/logger';
import { domainEventBus } from './DomainEventBus'

export class RevenueIntelligenceOrchestrator {
  constructor() {
    this.register()
  }

  register() {
    domainEventBus.subscribe('appointment.created', async (event) => {
      logger.info({ data: event.entity_id }, 'Orchestrator: appointment created')
    })

    domainEventBus.subscribe('transaction.completed', async (event) => {
      logger.info({ data: event.entity_id }, 'Orchestrator: transaction completed')
    })

    domainEventBus.subscribe('slot.idle_detected', async (event) => {
      logger.info({ data: event.payload }, 'Orchestrator: idle slot detected')
    })
  }
}

export const revenueOrchestrator = new RevenueIntelligenceOrchestrator()
