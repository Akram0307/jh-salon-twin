import logger from '../config/logger';
const log = logger.child({ module: 'ai_service' });

export class AIService {
  static async pauseCampaign(id: string): Promise<never> {
    log.warn({ id }, 'pauseCampaign not yet implemented');
    throw new Error('AIService.pauseCampaign not implemented');
  }

  static async resumeCampaign(id: string): Promise<never> {
    log.warn({ id }, 'resumeCampaign not yet implemented');
    throw new Error('AIService.resumeCampaign not implemented');
  }

  static async generateForecast(salonId: string): Promise<never> {
    log.warn({ salonId }, 'generateForecast not yet implemented');
    throw new Error('AIService.generateForecast not implemented');
  }

  static async recomputePopularity(salonId: string): Promise<never> {
    log.warn({ salonId }, 'recomputePopularity not yet implemented');
    throw new Error('AIService.recomputePopularity not implemented');
  }

  static async generateOffer(params: { salonId: string; clientId: string; serviceId: string }): Promise<never> {
    log.warn(params, 'generateOffer not yet implemented');
    throw new Error('AIService.generateOffer not implemented');
  }
}
