
import logger from '../config/logger';
const log = logger.child({ module: 'client_revenue_orchestrator' });
import { UpsellService } from './UpsellService'
import { sendWaitlistOffer } from './TwilioWhatsAppService'
import { DynamicOfferGenerator } from './DynamicOfferGenerator'

export class ClientRevenueOrchestrator {

  async runDailyRevenueCycle(salonId: string) {
    log.info({ data: salonId }, '[ClientRevenueOrchestrator] Starting automated revenue cycle for salon:')

    try {
      const offerEngine = new DynamicOfferGenerator()

      // Phase 1: Rebooking detection (stub)
      log.info('[RevenueCycle] Checking client rebooking opportunities...')

      // Phase 2: Upsell Trigger Layer
      log.info('[RevenueCycle] Evaluating upsell opportunities...')

      const baseServiceId = '2bb87460-320b-42d8-9f07-3fbb659e6b0f'

      const upsells = await UpsellService.getUpsells(baseServiceId)

      if (upsells && upsells.length > 0) {
        const upsellServiceId = upsells[0]

        log.info({ data: upsellServiceId }, '[UpsellTrigger] Found upsell opportunity:')

        // Example phone placeholder
        const phone = '+10000000000'

        // NEW: Generate dynamic personalized offer
        let offer=null; if(/^[0-9a-fA-F-]{36}$/.test(salonId)){ offer = await offerEngine.generateOffer(salonId, upsellServiceId); } else { log.info({ data: salonId }, "[DynamicOffer] Skipped non‑UUID salonId:"); }

        let serviceName = 'Recommended Add-On Service'
        let slot = 'Next Available Slot'
if (offer && offer.message) log.info({ data: offer.message }, '[DynamicOffer] Generated message:')


        await sendWaitlistOffer(
          salonId,
          phone,
          serviceName,
          slot,
          upsellServiceId
        )

        log.info({ data: offer }, '[OfferEngine] Personalized offer generated and sent:')
      }

      // Phase 3: Demand forecasting (stub)
      log.info('[RevenueCycle] Evaluating demand forecast...')

      // Phase 4: Messaging activation
      log.info('[RevenueCycle] Triggering WhatsApp engagement workflows...')

      log.info('[ClientRevenueOrchestrator] Revenue cycle completed successfully')

    } catch (error) {
      log.error({ err: error }, '[ClientRevenueOrchestrator] Revenue cycle failed:')
    }
  }
}
