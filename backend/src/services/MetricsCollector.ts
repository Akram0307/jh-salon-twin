import { query } from '../config/db';
import { RankedSlot } from './SmartSlotRanker';

export interface SlotSuggestionMetric {
  id?: string;
  salon_id: string;
  client_id: string;
  service_id: string;
  suggested_slots: RankedSlot[];
  accepted_slot?: RankedSlot;
  response_time_ms: number;
  timestamp: Date;
  algorithm_version?: string;
}

export interface AnalyticsReport {
  period: 'daily' | 'weekly' | 'monthly';
  start_date: Date;
  end_date: Date;
  total_suggestions: number;
  accepted_suggestions: number;
  acceptance_rate: number;
  average_response_time_ms: number;
  top_performing_slots: {
    slot_time: Date;
    staff_id: string;
    acceptance_count: number;
  }[];
  revenue_impact?: number;
}

export class MetricsCollector {
  /**
   * Log a slot suggestion event
   */
  static async logSuggestion(metric: SlotSuggestionMetric): Promise<void> {
    await query(
      `INSERT INTO slot_suggestion_metrics
       (salon_id, client_id, service_id, suggested_slots, accepted_slot, response_time_ms, timestamp, algorithm_version)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        metric.salon_id,
        metric.client_id,
        metric.service_id,
        JSON.stringify(metric.suggested_slots),
        metric.accepted_slot ? JSON.stringify(metric.accepted_slot) : null,
        metric.response_time_ms,
        metric.timestamp,
        metric.algorithm_version || 'v1.0'
      ]
    );
  }

  /**
   * Log an acceptance event
   */
  static async logAcceptance(
    metricId: string,
    acceptedSlot: RankedSlot
  ): Promise<void> {
    await query(
      `UPDATE slot_suggestion_metrics
       SET accepted_slot = $1
       WHERE id = $2`,
      [JSON.stringify(acceptedSlot), metricId]
    );
  }

  /**
   * Get acceptance rate for a salon over a period
   */
  static async getAcceptanceRate(
    salonId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{ total: number; accepted: number; rate: number }> {
    const res = await query(
      `SELECT
         COUNT(*) as total,
         COUNT(accepted_slot) as accepted
       FROM slot_suggestion_metrics
       WHERE salon_id = $1
       AND timestamp BETWEEN $2 AND $3`,
      [salonId, startDate, endDate]
    );

    const row = res.rows[0];
    const total = parseInt(row.total);
    const accepted = parseInt(row.accepted);
    const rate = total > 0 ? (accepted / total) * 100 : 0;

    return { total, accepted, rate };
  }

  /**
   * Get average response time for a salon over a period
   */
  static async getAverageResponseTime(
    salonId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    const res = await query(
      `SELECT AVG(response_time_ms) as avg_response_time
       FROM slot_suggestion_metrics
       WHERE salon_id = $1
       AND timestamp BETWEEN $2 AND $3`,
      [salonId, startDate, endDate]
    );

    return parseFloat(res.rows[0]?.avg_response_time || '0');
  }

  /**
   * Get top performing slots for a salon over a period
   */
  static async getTopPerformingSlots(
    salonId: string,
    startDate: Date,
    endDate: Date,
    limit: number = 10
  ): Promise<{ slot_time: Date; staff_id: string; acceptance_count: number }[]> {
    const res = await query(
      `SELECT
         (accepted_slot->>'slotTime')::timestamp as slot_time,
         accepted_slot->>'staffId' as staff_id,
         COUNT(*) as acceptance_count
       FROM slot_suggestion_metrics
       WHERE salon_id = $1
       AND timestamp BETWEEN $2 AND $3
       AND accepted_slot IS NOT NULL
       GROUP BY (accepted_slot->>'slotTime'), accepted_slot->>'staffId'
       ORDER BY acceptance_count DESC
       LIMIT $4`,
      [salonId, startDate, endDate, limit]
    );

    return res.rows.map((row: any) => ({
      slot_time: new Date(row.slot_time),
      staff_id: row.staff_id,
      acceptance_count: parseInt(row.acceptance_count)
    }));
  }

  /**
   * Generate analytics report for a salon over a period
   */
  static async generateAnalyticsReport(
    salonId: string,
    period: 'daily' | 'weekly' | 'monthly',
    startDate: Date,
    endDate: Date
  ): Promise<AnalyticsReport> {
    const acceptanceData = await this.getAcceptanceRate(salonId, startDate, endDate);
    const avgResponseTime = await this.getAverageResponseTime(salonId, startDate, endDate);
    const topSlots = await this.getTopPerformingSlots(salonId, startDate, endDate);

    // Calculate revenue impact (simplified)
    const revenueImpact = acceptanceData.accepted * 50; // Assuming average $50 per booking

    return {
      period,
      start_date: startDate,
      end_date: endDate,
      total_suggestions: acceptanceData.total,
      accepted_suggestions: acceptanceData.accepted,
      acceptance_rate: acceptanceData.rate,
      average_response_time_ms: avgResponseTime,
      top_performing_slots: topSlots,
      revenue_impact: revenueImpact
    };
  }

  /**
   * Get metrics by algorithm version
   */
  static async getMetricsByAlgorithm(
    salonId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{ algorithm_version: string; total: number; accepted: number; rate: number }[]> {
    const res = await query(
      `SELECT
         algorithm_version,
         COUNT(*) as total,
         COUNT(accepted_slot) as accepted,
         ROUND(COUNT(accepted_slot)::numeric / COUNT(*) * 100, 2) as rate
       FROM slot_suggestion_metrics
       WHERE salon_id = $1
       AND timestamp BETWEEN $2 AND $3
       GROUP BY algorithm_version
       ORDER BY rate DESC`,
      [salonId, startDate, endDate]
    );

    return res.rows.map((row: any) => ({
      algorithm_version: row.algorithm_version,
      total: parseInt(row.total),
      accepted: parseInt(row.accepted),
      rate: parseFloat(row.rate)
    }));
  }

  /**
   * Clean up old metrics (retention policy)
   */
  static async cleanupOldMetrics(retentionDays: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const res = await query(
      `DELETE FROM slot_suggestion_metrics
       WHERE timestamp < $1
       RETURNING id`,
      [cutoffDate]
    );

    return res.rowCount || 0;
  }
}
