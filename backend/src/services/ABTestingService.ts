import { query } from '../config/db';
import { RankedSlot } from './SmartSlotRanker';
import type { ExperimentResultDbRow, ExperimentSummaryResult } from '../types/serviceTypes';

export interface Experiment {
  id: string;
  name: string;
  description: string;
  algorithm_a: string; // Control algorithm
  algorithm_b: string; // Variant algorithm
  start_date: Date;
  end_date?: Date;
  status: 'active' | 'paused' | 'completed';
  traffic_split: number; // Percentage for variant (0-100)
}

export interface ExperimentResult {
  experiment_id: string;
  algorithm: string;
  total_suggestions: number;
  accepted_suggestions: number;
  acceptance_rate: number;
  average_rank?: number;
  revenue_impact?: number;
}

export interface SuggestionEvent {
  experiment_id?: string;
  algorithm: string;
  client_id: string;
  salon_id: string;
  service_id: string;
  suggested_slots: RankedSlot[];
  accepted_slot?: RankedSlot;
  timestamp: Date;
}

export class ABTestingService {
  /**
   * Create a new A/B testing experiment
   */
  static async createExperiment(experiment: Omit<Experiment, 'id'>): Promise<Experiment> {
    const res = await query(
      `INSERT INTO ab_testing_experiments
       (name, description, algorithm_a, algorithm_b, start_date, end_date, status, traffic_split)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        experiment.name,
        experiment.description,
        experiment.algorithm_a,
        experiment.algorithm_b,
        experiment.start_date,
        experiment.end_date || null,
        experiment.status || 'active',
        experiment.traffic_split || 50
      ]
    );

    return res.rows[0];
  }

  /**
   * Get active experiment for a salon
   */
  static async getActiveExperiment(salonId: string): Promise<Experiment | null> {
    const res = await query(
      `SELECT * FROM ab_testing_experiments
       WHERE status = 'active'
       AND (end_date IS NULL OR end_date > NOW())
       AND start_date <= NOW()
       ORDER BY start_date DESC
       LIMIT 1`
    );

    return res.rows[0] || null;
  }

  /**
   * Determine which algorithm to use for a given request
   */
  static async getAlgorithmForRequest(
    salonId: string,
    clientId: string
  ): Promise<{ algorithm: string; experimentId?: string }> {
    const experiment = await this.getActiveExperiment(salonId);
    
    if (!experiment) {
      return { algorithm: 'control' };
    }

    // Simple hash-based assignment
    const hash = this.hashString(clientId + salonId);
    const bucket = hash % 100;
    
    if (bucket < experiment.traffic_split) {
      return { algorithm: experiment.algorithm_b, experimentId: experiment.id };
    } else {
      return { algorithm: experiment.algorithm_a, experimentId: experiment.id };
    }
  }

  /**
   * Log a suggestion event
   */
  static async logSuggestionEvent(event: SuggestionEvent): Promise<void> {
    await query(
      `INSERT INTO ab_testing_events
       (experiment_id, algorithm, client_id, salon_id, service_id, suggested_slots, accepted_slot, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        event.experiment_id || null,
        event.algorithm,
        event.client_id,
        event.salon_id,
        event.service_id,
        JSON.stringify(event.suggested_slots),
        event.accepted_slot ? JSON.stringify(event.accepted_slot) : null,
        event.timestamp
      ]
    );
  }

  /**
   * Log an acceptance event
   */
  static async logAcceptance(
    eventId: string,
    acceptedSlot: RankedSlot
  ): Promise<void> {
    await query(
      `UPDATE ab_testing_events
       SET accepted_slot = $1
       WHERE id = $2`,
      [JSON.stringify(acceptedSlot), eventId]
    );
  }

  /**
   * Get experiment results
   */
  static async getExperimentResults(experimentId: string): Promise<ExperimentResult[]> {
    const res = await query(
      `SELECT
         experiment_id,
         algorithm,
         COUNT(*) as total_suggestions,
         COUNT(accepted_slot) as accepted_suggestions,
         ROUND(COUNT(accepted_slot)::numeric / COUNT(*) * 100, 2) as acceptance_rate
       FROM ab_testing_events
       WHERE experiment_id = $1
       GROUP BY experiment_id, algorithm`,
      [experimentId]
    );

    return res.rows.map((row: ExperimentResultDbRow) => ({
      experiment_id: row.experiment_id,
      algorithm: row.algorithm,
      total_suggestions: parseInt(row.total_suggestions),
      accepted_suggestions: parseInt(row.accepted_suggestions),
      acceptance_rate: parseFloat(row.acceptance_rate)
    }));
  }

  /**
   * Get overall experiment results with statistical significance
   */
  static async getExperimentSummary(experimentId: string): Promise<ExperimentSummaryResult> {
    const results = await this.getExperimentResults(experimentId);
    
    if (results.length < 2) {
      return { experiment_id: experimentId, results, significant: false };
    }

    const control = results.find(r => r.algorithm === 'control');
    const variant = results.find(r => r.algorithm === 'variant');

    if (!control || !variant) {
      return { experiment_id: experimentId, results, significant: false };
    }

    // Simple significance test (z-test for proportions)
    const p1 = control.acceptance_rate / 100;
    const p2 = variant.acceptance_rate / 100;
    const n1 = control.total_suggestions;
    const n2 = variant.total_suggestions;

    const pooledP = (p1 * n1 + p2 * n2) / (n1 + n2);
    const se = Math.sqrt(pooledP * (1 - pooledP) * (1/n1 + 1/n2));
    const z = (p2 - p1) / se;
    const significant = Math.abs(z) > 1.96; // 95% confidence

    return {
      experiment_id: experimentId,
      results,
      control_acceptance_rate: control.acceptance_rate,
      variant_acceptance_rate: variant.acceptance_rate,
      improvement: ((variant.acceptance_rate - control.acceptance_rate) / control.acceptance_rate * 100).toFixed(2) + '%',
      significant,
      z_score: z.toFixed(3)
    };
  }

  /**
   * Pause an experiment
   */
  static async pauseExperiment(experimentId: string): Promise<void> {
    await query(
      `UPDATE ab_testing_experiments
       SET status = 'paused'
       WHERE id = $1`,
      [experimentId]
    );
  }

  /**
   * Complete an experiment
   */
  static async completeExperiment(experimentId: string): Promise<void> {
    await query(
      `UPDATE ab_testing_experiments
       SET status = 'completed', end_date = NOW()
       WHERE id = $1`,
      [experimentId]
    );
  }

  /**
   * Simple hash function for consistent assignment
   */
  private static hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}
