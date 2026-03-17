import { WaitlistRepository } from '../repositories/WaitlistRepository';
import { WaitlistOfferRepository } from '../repositories/WaitlistOfferRepository';

import logger from '../config/logger';

export class AIWaitlistRecoveryOrchestrator {

  static async runRecoveryCycle() {

    const today = new Date().toISOString().slice(0,10);

    const pending = await WaitlistRepository.getPendingByDate(today);

    // basic prioritization: earliest preferred time first
    const ranked = pending.sort((a:any,b:any)=>{
      if(!a.preferred_time_range || !b.preferred_time_range) return 0
      return a.preferred_time_range.localeCompare(b.preferred_time_range)
    })

    let offersCreated = 0

    for (const entry of ranked.slice(0,10)) { // limit recovery wave
      try {
        await WaitlistOfferRepository.createOffer(process.env.SALON_ID || 'default-salon', entry.id, entry.service_id || 'unknown-service', entry.preferred_time_range || '09:00')
        offersCreated++
      } catch (err) {
        logger.error({ err: err }, 'AI waitlist recovery failed')
      }
    }

    return {
      scanned: pending.length,
      prioritized: ranked.length,
      offersCreated
    }
  }
}

