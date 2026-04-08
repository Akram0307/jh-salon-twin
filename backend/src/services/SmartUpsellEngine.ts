import { query } from '../config/db';
import logger from '../config/logger';

const log = logger.child({ module: 'smart_upsell_engine' });

// ─── Return-type contracts ───────────────────────────────────────

export interface UpsellSuggestion {
  id: string;
  name: string;
  price: number;
  /** Backward-compat: rows used to be just {id, name, price} */
  reason: string;
  confidence: number;      // 0-1 how confident the engine is
  category: 'affinity' | 'price_tier' | 'time_based' | 'popular';
  durationMinutes?: number;
}

export interface ServiceAffinity {
  serviceId: string;
  serviceName: string;
  coBookedServiceId: string;
  coBookedServiceName: string;
  coOccurrenceCount: number;
}

export interface PriceTierInfo {
  tier: 'economy' | 'standard' | 'premium';
  minPrice: number;
  maxPrice: number;
}

// ─── SmartUpsellEngine ───────────────────────────────────────────

export class SmartUpsellEngine {

  /**
   * recommendAddons – upgraded from hardcoded category='addon' stub.
   * Now considers: service affinity, price-tier matching, time-based express suggestions.
   * Backward-compatible: still returns array of {id, name, price} plus new fields.
   */
  static async recommendAddons(serviceId: string, salonId: string): Promise<UpsellSuggestion[]> {
    const [affinityRecs, priceTierRecs, timeRecs, popularRecs] = await Promise.all([
      this.getAffinityRecommendations(serviceId, salonId),
      this.getPriceTierRecommendations(serviceId, salonId),
      this.getTimeBasedRecommendations(salonId),
      this.getPopularAddons(salonId),
    ]);

    // Merge and deduplicate by service id, keeping highest confidence
    const merged = new Map<string, UpsellSuggestion>();

    const allRecs = [...affinityRecs, ...priceTierRecs, ...timeRecs, ...popularRecs];
    for (const rec of allRecs) {
      const existing = merged.get(rec.id);
      if (!existing || rec.confidence > existing.confidence) {
        merged.set(rec.id, rec);
      }
    }

    // Sort by confidence descending, limit to top 5
    const sorted = Array.from(merged.values())
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5);

    // Filter out the source service itself
    return sorted.filter(s => s.id !== serviceId);
  }

  // ── Private helpers ────────────────────────────────────────────

  /**
   * Service affinity: which services are frequently booked together.
   * Looks at appointment_services to find co-occurring services.
   */
  private static async getAffinityRecommendations(
    serviceId: string,
    salonId: string,
  ): Promise<UpsellSuggestion[]> {
    const res = await query(`
      SELECT
        co_service.id,
        co_service.name,
        co_service.price,
        co_service.duration_minutes,
        COUNT(*) AS co_occurrence
      FROM appointment_services aps1
      JOIN appointment_services aps2
        ON aps1.appointment_id = aps2.appointment_id
        AND aps1.service_id <> aps2.service_id
      JOIN services src_service
        ON aps1.service_id = src_service.id
      JOIN services co_service
        ON aps2.service_id = co_service.id
      JOIN appointments a
        ON aps1.appointment_id = a.id
      WHERE src_service.id = $1
        AND a.salon_id = $2
        AND a.status NOT IN ('cancelled')
        AND co_service.is_active = true
      GROUP BY co_service.id, co_service.name, co_service.price, co_service.duration_minutes
      ORDER BY co_occurrence DESC
      LIMIT 5
    `, [serviceId, salonId]);

    if (res.rows.length === 0) return [];

    // Normalize confidence: highest co-occurrence = 0.9, scale down
    const maxOcc = Number(res.rows[0].co_occurrence);

    return res.rows.map((r: any): UpsellSuggestion => ({
      id: r.id,
      name: r.name,
      price: Number(r.price),
      reason: `Frequently booked together with your service (${r.co_occurrence}x)`,
      confidence: Math.min(0.9, 0.5 + 0.4 * (Number(r.co_occurrence) / maxOcc)),
      category: 'affinity',
      durationMinutes: r.duration_minutes,
    }));
  }

  /**
   * Price-tier based: if client booked a premium service,
   * suggest premium add-ons. Economy → economy suggestions, etc.
   */
  private static async getPriceTierRecommendations(
    serviceId: string,
    salonId: string,
  ): Promise<UpsellSuggestion[]> {
    // Get the booked service's price and determine tier
    const srcRes = await query(`
      SELECT price, COALESCE(category, 'General') AS category
      FROM services
      WHERE id = $1 AND salon_id = $2
    `, [serviceId, salonId]);

    if (srcRes.rows.length === 0) return [];

    const srcPrice = Number(srcRes.rows[0].price);
    const tier = this.classifyPriceTier(srcPrice);

    // Get all services in a compatible price tier (not the same service)
    const tierRange = this.getTierRange(tier);
    const res = await query(`
      SELECT id, name, price, duration_minutes, COALESCE(category, 'General') AS category
      FROM services
      WHERE salon_id = $1
        AND id <> $2
        AND is_active = true
        AND price BETWEEN $3 AND $4
        AND COALESCE(category, 'General') NOT IN ('addon')
      ORDER BY price DESC
      LIMIT 3
    `, [salonId, serviceId, tierRange.min, tierRange.max]);

    return res.rows.map((r: any): UpsellSuggestion => ({
      id: r.id,
      name: r.name,
      price: Number(r.price),
      reason: `Matches your ${tier} service tier`,
      confidence: 0.65,
      category: 'price_tier',
      durationMinutes: r.duration_minutes,
    }));
  }

  /**
   * Time-based: if booking is during peak hours,
   * suggest express/shorter-duration services.
   * Otherwise, suggest premium add-ons (clients have more time off-peak).
   */
  private static async getTimeBasedRecommendations(
    salonId: string,
  ): Promise<UpsellSuggestion[]> {
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay(); // 0=Sun

    // Determine if current time is peak
    const isPeakHour = (hour >= 10 && hour <= 13) || (hour >= 16 && hour <= 19);
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    if (isPeakHour || isWeekend) {
      // Suggest express/short services during peak
      const res = await query(`
        SELECT id, name, price, duration_minutes, COALESCE(category, 'General') AS category
        FROM services
        WHERE salon_id = $1
          AND is_active = true
          AND duration_minutes <= 30
          AND COALESCE(category, 'General') != 'General'
        ORDER BY duration_minutes ASC, price ASC
        LIMIT 3
      `, [salonId]);

      return res.rows.map((r: any): UpsellSuggestion => ({
        id: r.id,
        name: r.name,
        price: Number(r.price),
        reason: 'Quick add-on — perfect during busy hours',
        confidence: 0.7,
        category: 'time_based',
        durationMinutes: r.duration_minutes,
      }));
    }

    // Off-peak: suggest premium/longer services
    const res = await query(`
      SELECT id, name, price, duration_minutes, COALESCE(category, 'General') AS category
      FROM services
      WHERE salon_id = $1
        AND is_active = true
        AND duration_minutes > 30
        AND price > (
          SELECT AVG(price) FROM services WHERE salon_id = $1 AND is_active = true
        )
      ORDER BY price DESC
      LIMIT 3
    `, [salonId]);

    return res.rows.map((r: any): UpsellSuggestion => ({
      id: r.id,
      name: r.name,
      price: Number(r.price),
      reason: 'Treat yourself — we have availability for premium services',
      confidence: 0.6,
      category: 'time_based',
      durationMinutes: r.duration_minutes,
    }));
  }

  /**
   * Fallback: popular add-ons by booking frequency.
   * Replaces the original hardcoded category='addon' query.
   */
  private static async getPopularAddons(salonId: string): Promise<UpsellSuggestion[]> {
    const res = await query(`
      SELECT
        s.id, s.name, s.price, s.duration_minutes,
        COALESCE(s.category, 'General') AS category,
        COUNT(aps.id) AS booking_count
      FROM services s
      LEFT JOIN appointment_services aps ON s.id = aps.service_id
      LEFT JOIN appointments a ON aps.appointment_id = a.id AND a.salon_id = $1
      WHERE s.salon_id = $1
        AND s.is_active = true
      GROUP BY s.id, s.name, s.price, s.duration_minutes, s.category
      ORDER BY booking_count DESC
      LIMIT 5
    `, [salonId]);

    if (res.rows.length === 0) return [];

    const maxBookings = Number(res.rows[0].booking_count) || 1;

    return res.rows.map((r: any): UpsellSuggestion => ({
      id: r.id,
      name: r.name,
      price: Number(r.price),
      reason: `Popular service (${r.booking_count} bookings)`,
      confidence: Math.min(0.5, 0.2 + 0.3 * (Number(r.booking_count) / maxBookings)),
      category: 'popular',
      durationMinutes: r.duration_minutes,
    }));
  }

  // ── Price tier classification ──────────────────────────────────

  private static classifyPriceTier(price: number): PriceTierInfo['tier'] {
    // Salon pricing heuristics (INR context — Jawed Habib)
    if (price < 300) return 'economy';
    if (price < 800) return 'standard';
    return 'premium';
  }

  private static getTierRange(tier: PriceTierInfo['tier']): { min: number; max: number } {
    switch (tier) {
      case 'economy':  return { min: 0, max: 499 };
      case 'standard': return { min: 300, max: 999 };
      case 'premium':  return { min: 600, max: 99999 };
    }
  }
}
