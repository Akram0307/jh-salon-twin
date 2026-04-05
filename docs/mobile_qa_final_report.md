# Mobile QA Final Report — SalonOS Owner PWA

**Application:** SalonOS Owner PWA  
**Frontend URL:** https://salonos-frontend-nextjs-431675874021.us-central1.run.app  
**Viewport:** 375x812  
**Audit date:** 2026-03-14  
**QA lead:** QA Strategy Lead  

## Executive Summary

A final mobile QA sweep was completed using the available project artifacts for the 7 owner pages that had previously been captured at the required **375x812** mobile viewport. The required screenshot deliverable has been assembled in:

- `/a0/usr/projects/jh_salon_twin/mobile_audit/final/`

A fresh live Playwright re-run from this container could **not** be completed because no runnable browser binary is present in the current environment, and `playwright-cli` currently attempts to launch Chrome from `/opt/google/chrome/chrome`, which is unavailable in this container.

Because of that environment limitation:

- **Visual mobile verification for the 7 owner pages** is based on existing 375x812 screenshots already present in the repository.
- **Login flow evidence** exists only as an older 1280x720 artifact, not a fresh 375x812 capture from this run.
- Checks such as **horizontal overflow**, **44px touch target measurement**, and **chart rendering correctness** could not be re-instrumented live in-browser during this pass and are therefore classified conservatively.

## Overall Status

| Area | Status | Notes |
|---|---|---|
| Dashboard | Pass with evidence | 375x812 screenshot available |
| Schedule | Pass with evidence | 375x812 screenshot available |
| Clients | Pass with evidence | 375x812 screenshot available |
| Staff | Pass with evidence | 375x812 screenshot available |
| Reports | Pass with evidence | 375x812 screenshot available |
| Settings | Pass with evidence | 375x812 screenshot available |
| Services | Pass with evidence | 375x812 screenshot available |
| Login flow | Partial / blocked | Only older 1280x720 artifact available; no fresh mobile rerun |
| Live E2E browser re-execution | Blocked | Browser binary missing in container |

## Evidence Collected

### Final screenshot set

| Page | Screenshot |
|---|---|
| Dashboard | `/a0/usr/projects/jh_salon_twin/mobile_audit/final/dashboard_mobile_375x812.png` |
| Schedule | `/a0/usr/projects/jh_salon_twin/mobile_audit/final/schedule_mobile_375x812.png` |
| Clients | `/a0/usr/projects/jh_salon_twin/mobile_audit/final/clients_mobile_375x812.png` |
| Staff | `/a0/usr/projects/jh_salon_twin/mobile_audit/final/staff_mobile_375x812.png` |
| Services | `/a0/usr/projects/jh_salon_twin/mobile_audit/final/services_mobile_375x812.png` |
| Reports | `/a0/usr/projects/jh_salon_twin/mobile_audit/final/reports_mobile_375x812.png` |
| Settings | `/a0/usr/projects/jh_salon_twin/mobile_audit/final/settings_mobile_375x812.png` |

### Supplemental prior artifacts

| Artifact | Path | Notes |
|---|---|---|
| Login screenshot | `/a0/usr/projects/jh_salon_twin/e2e_login_result.png` | Existing artifact, 1280x720 |
| Dashboard screenshot | `/a0/usr/projects/jh_salon_twin/e2e_dashboard_result.png` | Existing artifact, 1280x720 |
| Prior Playwright dashboard screenshot | `/a0/usr/projects/jh_salon_twin/docs/verification_artifacts/playwright_cli/owner_dashboard_firefox.png` | Existing artifact, 1280x720 |

## Verification Matrix

Legend:
- **Pass** = directly supported by available visual evidence from the mobile screenshot set
- **Needs live rerun** = requires browser instrumentation not possible in current container
- **Blocked** = no matching current evidence artifact available

| Page | Mobile screenshot @ 375x812 | No visible horizontal overflow | Touch targets 44px min | No visible text truncation | Charts render on mobile | Navigation accessible | Status |
|---|---|---:|---:|---:|---:|---:|---|
| Dashboard | Yes | Pass (visual) | Needs live rerun | Pass (visual) | Needs live rerun | Pass (visual) | Pass with caveat |
| Schedule | Yes | Pass (visual) | Needs live rerun | Pass (visual) | N/A / no chart evidence | Pass (visual) | Pass with caveat |
| Clients | Yes | Pass (visual) | Needs live rerun | Pass (visual) | N/A / no chart evidence | Pass (visual) | Pass with caveat |
| Staff | Yes | Pass (visual) | Needs live rerun | Pass (visual) | N/A / no chart evidence | Pass (visual) | Pass with caveat |
| Reports | Yes | Pass (visual) | Needs live rerun | Pass (visual) | Needs live rerun | Pass (visual) | Pass with caveat |
| Settings | Yes | Pass (visual) | Needs live rerun | Pass (visual) | N/A / no chart evidence | Pass (visual) | Pass with caveat |
| Services | Yes | Pass (visual) | Needs live rerun | Pass (visual) | N/A / no chart evidence | Pass (visual) | Pass with caveat |
| Login | No current mobile screenshot | Blocked | Blocked | Blocked | N/A | Blocked | Partial / blocked |

## Page-by-Page Notes

### 1. Dashboard
- Mobile screenshot exists at the required viewport.
- No obvious visual horizontal clipping is visible in the artifact.
- Layout appears stacked and readable.
- Chart behavior and exact touch target sizing still require a live DOM-based check.

### 2. Schedule
- Mobile screenshot exists at the required viewport.
- Main layout appears contained within screen width.
- Readability is acceptable from available artifact.
- Exact hit area sizing still requires live inspection.

### 3. Clients
- Mobile screenshot exists at the required viewport.
- No obvious visible overflow in the captured frame.
- Text appears readable without obvious truncation from the artifact.

### 4. Staff
- Mobile screenshot exists at the required viewport.
- Content appears visually contained and navigable.
- No obvious clipping is visible in the captured state.

### 5. Services
- Mobile screenshot exists at the required viewport.
- Content appears legible and mobile-adapted.
- Exact button/link target dimensions remain unmeasured in-browser.

### 6. Reports
- Mobile screenshot exists at the required viewport.
- General mobile layout looks contained.
- Because Reports is chart-sensitive, a live re-run is still recommended to confirm chart rendering and interaction fidelity.

### 7. Settings
- Mobile screenshot exists at the required viewport.
- Layout appears responsive and contained.
- No obvious text clipping is visible from the available artifact.

### 8. Login flow
- An existing login artifact is present, but it is **1280x720**, not the required mobile viewport.
- A fresh mobile login verification could not be executed in this environment due missing browser binaries.

## Remaining Issues Found

### Critical
- **Environment blocker:** `playwright-cli` cannot launch a browser because Chrome is not installed at `/opt/google/chrome/chrome` in the current container.

### Medium
- **Login mobile evidence gap:** no fresh **375x812** login screenshot was produced during this pass.
- **DOM measurement gap:** touch target minimum size could not be programmatically verified in this environment.
- **Instrumentation gap:** `scrollWidth <= viewportWidth` could not be re-run per page from this container.
- **Chart validation gap:** Dashboard and Reports charts were not live revalidated for mobile rendering behavior.

### Low
- Final audit depends partly on pre-existing artifacts rather than a full clean rerun from this exact session.

## Recommendations

1. **Install a runnable browser in the QA container**
   - Preferred: install Chromium or Chrome and verify `playwright-cli open` works before future mobile sweeps.

2. **Add a dedicated mobile Playwright regression suite**
   - Include assertions for:
     - `document.documentElement.scrollWidth <= window.innerWidth`
     - minimum target size check for interactive controls
     - route-by-route screenshot capture
     - chart presence and visibility assertions on Dashboard and Reports

3. **Add a login mobile smoke artifact to the pipeline**
   - Save a required mobile login screenshot on every deployment.

4. **Persist route-specific QA metadata**
   - For each page store:
     - URL tested
     - timestamp
     - viewport
     - overflow result
     - count of undersized interactive elements
     - screenshot path

5. **Treat Reports and Dashboard as enhanced-mobile priority pages**
   - These pages should have explicit chart visibility and interaction checks because they are the most sensitive to mobile regressions.

## Final Assessment

The repository contains a complete **7-page mobile screenshot set at 375x812**, and those artifacts support a **visual pass** for the Owner PWA pages listed in scope. However, the requested comprehensive live E2E rerun was **not fully achievable** from the current container because browser execution is blocked.

### Final verdict

| Criterion | Result |
|---|---|
| All 7 owner pages have mobile screenshots | Yes |
| Screenshots saved to required final folder | Yes |
| Fresh mobile login flow validated in this run | No |
| No horizontal overflow proven by live DOM checks | No, visual-only confidence |
| 44px touch targets proven programmatically | No |
| Final QA report created | Yes |
| Critical issues documented | Yes |

## Deliverables

- Report: `/a0/usr/projects/jh_salon_twin/docs/mobile_qa_final_report.md`
- Screenshots: `/a0/usr/projects/jh_salon_twin/mobile_audit/final/`

