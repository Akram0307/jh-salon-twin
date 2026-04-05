import { query } from '../config/db';

export const SALON_ID = process.env.SALON_ID || 'b0dcbd9e-1ca0-450e-a299-7ad239f848f4';

export const asBool = (value: unknown, fallback = true) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
    if (['false', '0', 'no', 'off'].includes(normalized)) return false;
  }
  return fallback;
};

export const normalizeTime = (value: unknown) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const match = trimmed.match(/^(\d{2}:\d{2})(?::\d{2})?$/);
  return match ? match[1] : null;
};

export const normalizeWeekday = (value: unknown) => {
  const weekday = Number(value);
  if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) return null;
  return weekday;
};

export const findOverlappingScheduleRule = async ({
  staffId,
  weekday,
  startTime,
  endTime,
  excludeId,
}: {
  staffId: string;
  weekday: number;
  startTime: string;
  endTime: string;
  excludeId?: string;
}) => {
  const params: unknown[] = [SALON_ID, staffId, weekday, startTime, endTime];
  let sql = `SELECT id, start_time, end_time
             FROM staff_working_hours
             WHERE salon_id = $1
               AND staff_id = $2
               AND weekday = $3
               AND start_time < $5
               AND end_time > $4`;

  if (excludeId) {
    params.push(excludeId);
    sql += ' AND id <> $6';
  }

  sql += ' ORDER BY start_time ASC LIMIT 1';
  const result = await query(sql, params);
  return result.rows[0] || null;
};

export const formatScheduleRule = (row: Record<string, unknown>) => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return {
    id: row.id,
    staff_id: row.staff_id,
    staff_name: row.staff_name,
    staff_role: row.staff_role,
    staff_is_active: row.staff_is_active,
    weekday: Number(row.weekday),
    day_label: days[Number(row.weekday)] || `Day ${row.weekday}`,
    start_time: row.start_time ? String(row.start_time).slice(0, 5) : null,
    end_time: row.end_time ? String(row.end_time).slice(0, 5) : null,
    capacity: Number(row.capacity || 1),
    is_active: Boolean(row.is_active),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
};
