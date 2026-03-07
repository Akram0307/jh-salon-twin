#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const BASE = process.env.BACKEND_URL || 'https://salonos-backend-rgvcleapsa-uc.a.run.app';
const SALON_ID = process.env.SALON_ID || 'b0dcbd9e-1ca0-450e-a299-7ad239f848f4';
const STAFF_ID = process.env.STAFF_ID || '7c822f97-913f-4c85-9ceb-b667a1adcf43';
const REPORT_PATH = path.join(__dirname, 'schedule_crud_smoke_report.json');
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const SEED_CAPACITY = 1;

function hhmm(n) {
  return String(n).padStart(2, '0') + ':00';
}

function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && aEnd > bStart;
}

async function api(method, urlPath, body) {
  const res = await fetch(`${BASE}${urlPath}`, {
    method,
    headers: { 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });

  let json = null;
  let text = null;
  try {
    json = await res.json();
  } catch {
    try {
      text = await res.text();
    } catch {
      text = null;
    }
  }

  return {
    status: res.status,
    ok: res.ok,
    json,
    text,
  };
}

function summarize(step, expect) {
  if (!step) return false;
  if (typeof expect === 'number') return step.status === expect;
  if (Array.isArray(expect)) return expect.includes(step.status);
  if (typeof expect === 'function') return !!expect(step);
  return !!step.ok;
}

function pickSeedWindow(existingForDay) {
  for (let start = 6; start <= 20; start++) {
    const end = start + 1;
    if (end > 22) continue;
    const startTime = hhmm(start);
    const endTime = hhmm(end);
    const conflict = existingForDay.some((r) => overlaps(startTime, endTime, r.start_time, r.end_time));
    if (!conflict) {
      return { start_time: startTime, end_time: endTime, capacity: SEED_CAPACITY };
    }
  }
  return null;
}

async function main() {
  const report = {
    generated_at: new Date().toISOString(),
    success: false,
    service_url: BASE,
    salon_id: SALON_ID,
    staff: { id: STAFF_ID },
    seed_choice: null,
    cleanup: [],
    steps: {},
    notes: [],
  };

  const createdRuleIds = [];
  let seededRuleId = null;

  try {
    const list0 = await api('GET', `/api/owner/schedule-rules?salon_id=${encodeURIComponent(SALON_ID)}&staff_id=${encodeURIComponent(STAFF_ID)}`);
    report.steps.initial_list = list0;

    const rules = Array.isArray(list0?.json?.data) ? list0.json.data : [];
    if (rules.length > 0) {
      report.staff.full_name = rules[0].staff_name || null;
    }

    // Cleanup any previous smoke-owned rows if present.
    for (const rule of rules) {
      const isSmokeOwned = Number(rule.capacity) === SEED_CAPACITY && [2, 3, 4, 5, 6].includes(Number(rule.weekday));
      if (!isSmokeOwned) continue;
      const del = await api('DELETE', `/api/owner/schedule-rules/${rule.id}?salon_id=${encodeURIComponent(SALON_ID)}`);
      report.cleanup.push({ preflight_delete_id: rule.id, status: del.status, ok: del.ok, json: del.json || null, text: del.text || null });
    }

    const list1 = await api('GET', `/api/owner/schedule-rules?salon_id=${encodeURIComponent(SALON_ID)}&staff_id=${encodeURIComponent(STAFF_ID)}`);
    report.steps.post_cleanup_list = list1;
    const cleanRules = Array.isArray(list1?.json?.data) ? list1.json.data : [];

    let chosenWeekday = null;
    let chosenWindow = null;
    for (const weekday of [2, 3, 4, 5, 6]) {
      const dayRules = cleanRules.filter((r) => Number(r.weekday) === weekday);
      const window = pickSeedWindow(dayRules);
      if (window) {
        chosenWeekday = weekday;
        chosenWindow = window;
        break;
      }
    }

    if (!chosenWindow) {
      throw new Error('No empty non-overlapping slot found for seed rule');
    }

    report.seed_choice = {
      weekday: chosenWeekday,
      day_label: DAY_LABELS[chosenWeekday],
      ...chosenWindow,
    };

    const invalidPayload = {
      staff_id: STAFF_ID,
      weekday: chosenWeekday,
      start_time: chosenWindow.end_time,
      end_time: chosenWindow.start_time,
      capacity: SEED_CAPACITY,
      is_active: true,
    };
    report.steps.invalid_guard = await api('POST', `/api/owner/schedule-rules?salon_id=${encodeURIComponent(SALON_ID)}`, invalidPayload);

    const createPayload = {
      staff_id: STAFF_ID,
      weekday: chosenWeekday,
      start_time: chosenWindow.start_time,
      end_time: chosenWindow.end_time,
      capacity: SEED_CAPACITY,
      is_active: true,
    };
    const createStep = await api('POST', `/api/owner/schedule-rules?salon_id=${encodeURIComponent(SALON_ID)}`, createPayload);
    report.steps.create = createStep;

    seededRuleId = createStep?.json?.data?.id || null;
    if (seededRuleId) createdRuleIds.push(seededRuleId);

    report.steps.list_after_create = await api('GET', `/api/owner/schedule-rules?salon_id=${encodeURIComponent(SALON_ID)}&staff_id=${encodeURIComponent(STAFF_ID)}`);
    report.steps.list_after_create.contains_created = Array.isArray(report.steps.list_after_create?.json?.data)
      ? report.steps.list_after_create.json.data.some((r) => r.id === seededRuleId)
      : false;

    const updatePayload = {
      start_time: chosenWindow.start_time,
      end_time: hhmm(Number(chosenWindow.end_time.slice(0, 2)) + 1),
      capacity: 2,
      is_active: true,
    };
    report.steps.update = seededRuleId
      ? await api('PUT', `/api/owner/schedule-rules/${seededRuleId}?salon_id=${encodeURIComponent(SALON_ID)}`, updatePayload)
      : { status: 0, ok: false, json: { success: false, error: 'seededRuleId missing' } };

    const overlapPayload = {
      staff_id: STAFF_ID,
      weekday: chosenWeekday,
      start_time: chosenWindow.start_time,
      end_time: hhmm(Number(chosenWindow.end_time.slice(0, 2)) + 1),
      capacity: SEED_CAPACITY,
      is_active: true,
    };
    report.steps.overlap_conflict = await api('POST', `/api/owner/schedule-rules?salon_id=${encodeURIComponent(SALON_ID)}`, overlapPayload);

    report.steps.delete = seededRuleId
      ? await api('DELETE', `/api/owner/schedule-rules/${seededRuleId}?salon_id=${encodeURIComponent(SALON_ID)}`)
      : { status: 0, ok: false, json: { success: false, error: 'seededRuleId missing' } };

    report.steps.final_list = await api('GET', `/api/owner/schedule-rules?salon_id=${encodeURIComponent(SALON_ID)}&staff_id=${encodeURIComponent(STAFF_ID)}`);
    report.steps.final_list.contains_created = Array.isArray(report.steps.final_list?.json?.data)
      ? report.steps.final_list.json.data.some((r) => r.id === seededRuleId)
      : false;

    report.success = [
      summarize(report.steps.initial_list, 200),
      summarize(report.steps.post_cleanup_list, 200),
      summarize(report.steps.invalid_guard, 400),
      summarize(report.steps.create, 201),
      report.steps.list_after_create.contains_created === true,
      summarize(report.steps.update, 200),
      summarize(report.steps.overlap_conflict, 409),
      summarize(report.steps.delete, [200, 204]),
      summarize(report.steps.final_list, 200),
      report.steps.final_list.contains_created === false,
    ].every(Boolean);
  } catch (error) {
    report.notes.push(String(error && error.stack ? error.stack : error));
  } finally {
    // Best-effort cleanup in case delete step failed or script aborted after create.
    if (seededRuleId) {
      try {
        const postDeleteCheck = await api('GET', `/api/owner/schedule-rules?salon_id=${encodeURIComponent(SALON_ID)}&staff_id=${encodeURIComponent(STAFF_ID)}`);
        const stillExists = Array.isArray(postDeleteCheck?.json?.data)
          ? postDeleteCheck.json.data.some((r) => r.id === seededRuleId)
          : false;
        if (stillExists) {
          const cleanupDelete = await api('DELETE', `/api/owner/schedule-rules/${seededRuleId}?salon_id=${encodeURIComponent(SALON_ID)}`);
          report.cleanup.push({ postflight_delete_id: seededRuleId, status: cleanupDelete.status, ok: cleanupDelete.ok, json: cleanupDelete.json || null, text: cleanupDelete.text || null });
        }
      } catch (cleanupErr) {
        report.cleanup.push({ postflight_delete_id: seededRuleId, error: String(cleanupErr) });
      }
    }

    fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
    console.log(REPORT_PATH);
    console.log(JSON.stringify(report, null, 2));
    process.exit(report.success ? 0 : 1);
  }
}

main();
