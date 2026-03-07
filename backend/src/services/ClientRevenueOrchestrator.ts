import { UpsellService } from './UpsellService'
import { sendWaitlistOffer } from './TwilioWhatsAppService'
import { DynamicOfferGenerator } from './DynamicOfferGenerator'

export class ClientRevenueOrchestrator {

  async runDailyRevenueCycle(salonId: string) {
    console.log('[ClientRevenueOrchestrator] Starting automated revenue cycle for salon:', salonId)

    try {
      const offerEngine = new DynamicOfferGenerator()

      // Phase 1: Rebooking detection (stub)
      console.log('[RevenueCycle] Checking client rebooking opportunities...')

      // Phase 2: Upsell Trigger Layer
      console.log('[RevenueCycle] Evaluating upsell opportunities...')

      const baseServiceId = '2bb87460-320b-42d8-9f07-3fbb659e6b0f'

      const upsells = await UpsellService.getUpsells(baseServiceId)

      if (upsells && upsells.length > 0) {
        const upsellServiceId = upsells[0]

        console.log('[UpsellTrigger] Found upsell opportunity:', upsellServiceId)

        // Example phone placeholder
        const phone = '+10000000000'

        // NEW: Generate dynamic personalized offer
        let offer=null; if(/^[0-9a-fA-F-]{36}$/.test(salonId)){ offer = await offerEngine.generateOffer(salonId, upsellServiceId); } else { console.log("[DynamicOffer] Skipped non‑UUID salonId:", salonId); }

        let serviceName = 'Recommended Add-On Service'
        let slot = 'Next Available Slot'
if (offer && offer.message) console.log('[DynamicOffer] Generated message:', offer.message)


        await sendWaitlistOffer(
          salonId,
          phone,
          serviceName,
          slot,
          upsellServiceId
        )

        console.log('[OfferEngine] Personalized offer generated and sent:', offer)
      }

      // Phase 3: Demand forecasting (stub)
      console.log('[RevenueCycle] Evaluating demand forecast...')

      // Phase 4: Messaging activation
      console.log('[RevenueCycle] Triggering WhatsApp engagement workflows...')

      console.log('[ClientRevenueOrchestrator] Revenue cycle completed successfully')

    } catch (error) {
      console.error('[ClientRevenueOrchestrator] Revenue cycle failed:', error)
    }
  }
}
