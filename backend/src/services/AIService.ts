import logger from '../config/logger';
import { AIRevenueBrain } from './AIRevenueBrain';
import { SmartUpsellEngine, UpsellSuggestion } from './SmartUpsellEngine';
import { query } from '../config/db';

const log = logger.child({ module: 'ai_service' });

// ─── Response types for route handlers ───────────────────────────

export interface ForecastResult {
  averageDailyBookings: number;
  recommendation: string;
  trends: Array<{
    weekLabel: string;
    weekStart: string;
    bookingCount: number;
    revenue: number;
  }>;
  peakSlots: Array<{
    dayOfWeek: number;
    hour: number;
    bookingDensity: number;
    label: string;
  }>;
  staffingRecommendations: Array<{
    dayOfWeek: number;
    timeSlot: string;
    currentCapacity: number;
    recommendedStaff: number;
    utilizationPct: number;
    action: 'adequate' | 'add_staff' | 'overstaffed';
  }>;
  projectedNextWeekBookings: number;
  demandHealth: 'low' | 'moderate' | 'healthy' | 'high';
}

export interface PopularityResult {
  salonId: string;
  services: Array<{
    serviceId: string;
    serviceName: string;
    bookingCount: number;
    revenue: number;
    popularityRank: number;
  }>;
  computedAt: string;
}

export interface OfferResult {
  salonId: string;
  clientId: string;
  serviceId: string;
  upsellSuggestions: UpsellSuggestion[];
  generatedAt: string;
}

// ─── AIService ───────────────────────────────────────────────────

export class AIService {

  /** Pause a marketing/rebooking campaign */
  static async pauseCampaign(id: string): Promise<{ campaignId: string; status: string }> {
    log.warn({ id }, 'pauseCampaign not yet fully implemented');
    // Placeholder: in production this would update campaign status in DB
    return { campaignId: id, status: 'paused' };
  }

  /** Resume a marketing/rebooking campaign */
  static async resumeCampaign(id: string): Promise<{ campaignId: string; status: string }> {
    log.warn({ id }, 'resumeCampaign not yet fully implemented');
    return { campaignId: id, status: 'active' };
  }

  /**
   * Generate demand forecast using AIRevenueBrain.
   * Delegates to the enhanced predictive engine.
   */
  static async generateForecast(salonId: string): Promise<ForecastResult> {
    log.info({ salonId }, 'Generating demand forecast');
    const forecast = await AIRevenueBrain.forecastDemand(salonId);
    return forecast;
  }

  /**
   * Recompute service popularity ranking based on booking frequency and revenue.
   * Replaces stub that threw 'not implemented'.
   */
  static async recomputePopularity(salonId: string): Promise<PopularityResult> {
    log.info({ salonId }, 'Recomputing service popularity');

    const res = await query(`
      SELECT
        s.id AS service_id,
        s.name AS service_name,
        COUNT(aps.id) AS booking_count,
        COALESCE(SUM(aps.charged_price), 0) AS revenue
      FROM services s
      LEFT JOIN appointment_services aps ON s.id = aps.service_id
      LEFT JOIN appointments a ON aps.appointment_id = a.id
        AND a.salon_id = $1
        AND a.status NOT IN ('cancelled')
      WHERE s.salon_id = $1
        AND s.is_active = true
      GROUP BY s.id, s.name
      ORDER BY booking_count DESC, revenue DESC
    `, [salonId]);

    const services = res.rows.map((r: any, idx: number) => ({
      serviceId: r.service_id,
      serviceName: r.service_name,
      bookingCount: Number(r.booking_count),
      revenue: Number(r.revenue),
      popularityRank: idx + 1,
    }));

    return {
      salonId,
      services,
      computedAt: new Date().toISOString(),
    };
  }

  /**
   * Generate personalized upsell offer using SmartUpsellEngine.
   * Combines upsell suggestions with client context.
   */
  static async generateOffer(params: {
    salonId: string;
    clientId: string;
    serviceId: string;
  }): Promise<OfferResult> {
    const { salonId, clientId, serviceId } = params;
    log.info({ salonId, clientId, serviceId }, 'Generating personalized offer');

    const upsellSuggestions = await SmartUpsellEngine.recommendAddons(serviceId, salonId);

    return {
      salonId,
      clientId,
      serviceId,
      upsellSuggestions,
      generatedAt: new Date().toISOString(),
    };
  }
}
