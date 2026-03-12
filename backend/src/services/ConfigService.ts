import { query } from '../config/db';

export type ConfigRecord = {
  salon_id: string | null;
  ai_name: string;
  ai_tone: string;
  operating_hours: unknown;
  buffer_time_minutes: number;
  deposit_required: boolean;
  updated_at: string | null;
};

type CacheEntry = {
  expiresAt: number;
  value: ConfigRecord;
};

const CACHE_TTL_MS = 60_000;

export class ConfigService {
  private static cache = new Map<string, CacheEntry>();
  private static hasSalonIdColumnCache: boolean | null = null;

  static async hasSalonIdColumn() {
    if (this.hasSalonIdColumnCache !== null) return this.hasSalonIdColumnCache;
    const result = await query(
      `SELECT 1
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'salon_config'
         AND column_name = 'salon_id'
       LIMIT 1`
    );
    this.hasSalonIdColumnCache = Boolean(result.rows[0]);
    return this.hasSalonIdColumnCache;
  }

  static normalize(row: any, salonId?: string): ConfigRecord {
    return {
      salon_id: row?.salon_id || salonId || null,
      ai_name: row?.ai_name || 'Digital Receptionist',
      ai_tone: row?.ai_tone || 'friendly and concise',
      operating_hours: row?.operating_hours || { open: '09:00', close: '21:00' },
      buffer_time_minutes: Number(row?.buffer_time_minutes ?? 15),
      deposit_required: Boolean(row?.deposit_required ?? false),
      updated_at: row?.updated_at || null,
    };
  }

  static async getConfig(salonId: string): Promise<ConfigRecord> {
    const cached = this.cache.get(salonId);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }

    const hasSalonId = await this.hasSalonIdColumn();
    let row: any = null;

    if (hasSalonId) {
      const specific = await query(
        `SELECT *
         FROM salon_config
         WHERE salon_id = $1
         ORDER BY updated_at DESC NULLS LAST
         LIMIT 1`,
        [salonId]
      );
      row = specific.rows[0] || null;
    }

    if (!row) {
      const fallback = await query(
        `SELECT *
         FROM salon_config
         ORDER BY CASE WHEN salon_id IS NULL THEN 0 ELSE 1 END, updated_at DESC NULLS LAST
         LIMIT 1`.replace('CASE WHEN salon_id IS NULL THEN 0 ELSE 1 END, ', hasSalonId ? 'CASE WHEN salon_id IS NULL THEN 0 ELSE 1 END, ' : '' )
      );
      row = fallback.rows[0] || null;
    }

    const value = this.normalize(row, salonId);
    this.cache.set(salonId, { value, expiresAt: Date.now() + CACHE_TTL_MS });
    return value;
  }

  static async updateConfig(salonId: string, patch: Partial<ConfigRecord>) {
    const current = await this.getConfig(salonId);
    const hasSalonId = await this.hasSalonIdColumn();
    const next = {
      ai_name: patch.ai_name ?? current.ai_name,
      ai_tone: patch.ai_tone ?? current.ai_tone,
      operating_hours: patch.operating_hours ?? current.operating_hours,
      buffer_time_minutes: Number(patch.buffer_time_minutes ?? current.buffer_time_minutes),
      deposit_required: Boolean(patch.deposit_required ?? current.deposit_required),
    };

    let result;

    if (hasSalonId) {
      result = await query(
        `INSERT INTO salon_config (salon_id, ai_name, ai_tone, operating_hours, buffer_time_minutes, deposit_required, updated_at)
         VALUES ($1,$2,$3,$4::jsonb,$5,$6,NOW())
         ON CONFLICT (salon_id)
         DO UPDATE SET
           ai_name = EXCLUDED.ai_name,
           ai_tone = EXCLUDED.ai_tone,
           operating_hours = EXCLUDED.operating_hours,
           buffer_time_minutes = EXCLUDED.buffer_time_minutes,
           deposit_required = EXCLUDED.deposit_required,
           updated_at = NOW()
         RETURNING *`,
        [salonId, next.ai_name, next.ai_tone, JSON.stringify(next.operating_hours), next.buffer_time_minutes, next.deposit_required]
      );
    } else {
      const existing = await query(`SELECT id FROM salon_config ORDER BY updated_at DESC NULLS LAST LIMIT 1`);
      if (existing.rows[0]?.id) {
        result = await query(
          `UPDATE salon_config
           SET ai_name = $1,
               ai_tone = $2,
               operating_hours = $3::jsonb,
               buffer_time_minutes = $4,
               deposit_required = $5,
               updated_at = NOW()
           WHERE id = $6
           RETURNING *`,
          [next.ai_name, next.ai_tone, JSON.stringify(next.operating_hours), next.buffer_time_minutes, next.deposit_required, existing.rows[0].id]
        );
      } else {
        result = await query(
          `INSERT INTO salon_config (ai_name, ai_tone, operating_hours, buffer_time_minutes, deposit_required, updated_at)
           VALUES ($1,$2,$3::jsonb,$4,$5,NOW())
           RETURNING *`,
          [next.ai_name, next.ai_tone, JSON.stringify(next.operating_hours), next.buffer_time_minutes, next.deposit_required]
        );
      }
    }

    const normalized = this.normalize(result.rows[0], salonId);
    this.cache.set(salonId, { value: normalized, expiresAt: Date.now() + CACHE_TTL_MS });
    return normalized;
  }

  static clearCache(salonId?: string) {
    if (salonId) {
      this.cache.delete(salonId);
      return;
    }
    this.cache.clear();
  }
}
