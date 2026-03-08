#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const BASE_URL = (process.env.BACKEND_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');
const API_BASE = `${BASE_URL}/api/staff`;
const reportPath = path.join(__dirname, 'staff_crud_smoke_report.json');

async function req(method, url, body) {
  const res = await fetch(url, {
    method,
    headers: { 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch (_) {}
  return { status: res.status, ok: res.ok, json, text };
}

async function main() {
  const ts = Date.now();
  const phone = `90000${String(ts).slice(-5)}`;
  const email = `staff-smoke-${ts}@example.com`;
  const report = { base_url: BASE_URL, created_at: new Date().toISOString(), steps: [] };

  const createPayload = {
    full_name: `Staff Smoke ${ts}`,
    email,
    phone_number: phone,
    role: 'stylist',
    is_active: true,
  };

  const createRes = await req('POST', API_BASE, createPayload);
  report.steps.push({ name: 'create', status: createRes.status, body: createRes.json || createRes.text });
  const createdId = createRes.json?.data?.id;

  const duplicateRes = await req('POST', API_BASE, {
    full_name: `Staff Smoke Duplicate ${ts}`,
    email: `other-${ts}@example.com`,
    phone_number: phone,
    role: 'stylist',
    is_active: true,
  });
  report.steps.push({ name: 'duplicate_phone_conflict', status: duplicateRes.status, body: duplicateRes.json || duplicateRes.text });

  let archiveRes = null;
  if (createdId) {
    archiveRes = await req('PUT', `${API_BASE}/${createdId}`, { is_active: false });
    report.steps.push({ name: 'archive', status: archiveRes.status, body: archiveRes.json || archiveRes.text });
  }

  const archivedListRes = await req('GET', `${API_BASE}?status=archived`);
  report.steps.push({ name: 'list_archived', status: archivedListRes.status, body: archivedListRes.json || archivedListRes.text });

  report.pass = createRes.status === 201 && duplicateRes.status === 409 && (!createdId || archiveRes?.status === 200) && archivedListRes.status === 200;

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.pass ? 0 : 1);
}

main().catch((err) => {
  const report = { base_url: BASE_URL, created_at: new Date().toISOString(), pass: false, fatal: String(err && err.stack || err) };
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
});
