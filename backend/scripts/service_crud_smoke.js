#!/usr/bin/env node
const fs = require('fs');

const BACKEND_URL = (process.env.BACKEND_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');

async function api(path, options = {}) {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    headers: { 'content-type': 'application/json', ...(options.headers || {}) },
    ...options,
  });

  let body = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }

  return { status: res.status, body };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

(async () => {
  const stamp = Date.now();
  const baseName = `PhaseA Service ${stamp}`;
  const report = { backend_url: BACKEND_URL, created_name: baseName, steps: [] };
  let createdId = null;

  try {
    const createPayload = {
      name: baseName,
      description: 'Phase A smoke service',
      duration_minutes: 45,
      price: 799,
      category: 'Testing',
      is_active: true,
    };
    const created = await api('/api/services', { method: 'POST', body: JSON.stringify(createPayload) });
    report.steps.push({ step: 'create', status: created.status, body: created.body });
    assert(created.status === 201, `Expected 201 on create, got ${created.status}`);
    assert(created.body?.success === true, 'Create did not return success=true');
    createdId = created.body?.data?.id;
    assert(createdId, 'Create response missing service id');

    const duplicate = await api('/api/services', { method: 'POST', body: JSON.stringify(createPayload) });
    report.steps.push({ step: 'duplicate_conflict', status: duplicate.status, body: duplicate.body });
    assert(duplicate.status === 409, `Expected 409 on duplicate create, got ${duplicate.status}`);
    assert(String(duplicate.body?.details?.duplicateName || '') === baseName, 'Duplicate conflict details.duplicateName does not match created service name');

    const archive = await api(`/api/services/${createdId}`, {
      method: 'PUT',
      body: JSON.stringify({ is_active: false }),
    });
    report.steps.push({ step: 'archive', status: archive.status, body: archive.body });
    assert(archive.status === 200, `Expected 200 on archive, got ${archive.status}`);
    assert(archive.body?.data?.is_active === false, 'Archive response did not set is_active=false');

    const restore = await api(`/api/services/${createdId}`, {
      method: 'PUT',
      body: JSON.stringify({ is_active: true }),
    });
    report.steps.push({ step: 'restore', status: restore.status, body: restore.body });
    assert(restore.status === 200, `Expected 200 on restore, got ${restore.status}`);
    assert(restore.body?.data?.is_active === true, 'Restore response did not set is_active=true');

    report.ok = true;
    report.message = 'Service CRUD smoke passed';
  } catch (error) {
    report.ok = false;
    report.error = error.message || String(error);
    process.exitCode = 1;
  } finally {
    fs.writeFileSync('backend/scripts/service_crud_smoke_report.json', JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
  }
})();
