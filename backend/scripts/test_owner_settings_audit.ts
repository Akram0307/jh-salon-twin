import { query } from '../src/config/db';
import { ConfigService } from '../src/services/ConfigService';
import { AuditLogRepository } from '../src/repositories/AuditLogRepository';

async function main() {
  const salonId = process.env.SALON_ID || 'b0dcbd9e-1ca0-450e-a299-7ad239f848f4';
  const marker = `PhaseB-${Date.now()}`;

  const before = await ConfigService.getConfig(salonId);
  const updated = await ConfigService.updateConfig(salonId, { ai_tone: marker });

  await AuditLogRepository.create({
    salon_id: salonId,
    actor_id: 'phase-b-test',
    actor_type: 'test',
    entity_type: 'owner_settings',
    entity_id: salonId,
    action: 'update',
    before_state: before,
    after_state: updated,
    diff: { ai_tone: { before: before.ai_tone, after: updated.ai_tone } },
    request_path: '/api/owner/settings',
    request_method: 'PUT',
  });

  const result = await query(
    `SELECT id, entity_type, action, actor_id, diff, created_at
     FROM audit_logs
     WHERE salon_id = $1 AND entity_type = 'owner_settings' AND actor_id = 'phase-b-test'
     ORDER BY created_at DESC
     LIMIT 1`,
    [salonId]
  );

  const row = result.rows[0] || null;
  const ok = Boolean(row && row.entity_type === 'owner_settings' && row.action === 'update');

  console.log(JSON.stringify({
    success: ok,
    salon_id: salonId,
    marker,
    audit_log: row,
  }, null, 2));

  if (!ok) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
