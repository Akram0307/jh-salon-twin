# SalonOS v1.0 — Release Notes

**Release Date:** April 8, 2026  
**Milestone:** Sprint 1 + Sprint 2 Completion

---

## 🚀 What's New in v1.0

### 1. Client PWA — New Booking Experience
**Sprint 1 Delivery**

A fully redesigned client-facing Progressive Web App built on **Next.js 14 App Router**.

| Feature | Description |
|---------|-------------|
| Service Selection | Browse categorized services with pricing and duration |
| Smart Time Slot Picker | Real-time availability with staff assignment |
| Instant Confirmation | 201 Created booking confirmation with reference code |
| Mobile-First Design | iPhone 14 viewport optimized (390×844) |
| PWA Capabilities | Offline support, app manifest, service worker |

**Endpoint:** `/client/booking`  
**Location:** `frontend-next/src/app/(client)/booking/page.tsx`

---

### 2. AI Revenue Brain — Predictive Forecasting
**Sprint 2 Delivery**

ML-powered revenue intelligence that forecasts salon performance.

| Capability | Description |
|-----------|-------------|
| Revenue Forecasting | 30/60/90-day predictive models |
| Trend Analysis | Week-over-week and month-over-month patterns |
| Staff Performance | Individual revenue attribution by stylist |
| Seasonal Insights | Pattern detection for busy periods |

**Location:** `backend/src/services/ai/AIRevenueBrain.ts`

---

### 3. Smart Upsell Engine — Market Basket Analysis
**Sprint 2 Delivery**

AI-driven product and service recommendations based on booking patterns.

| Feature | Description |
|---------|-------------|
| Service Bundling | Suggests complementary services |
| Product Recommendations | Retail product cross-sell |
| Pattern Mining | Market basket analysis on historical bookings |
| Real-Time Scoring | Per-booking upsell probability |

**Location:** `backend/src/services/ai/SmartUpsellEngine.ts`

---

## 🧪 Quality Assurance

### E2E Test Coverage
All critical paths validated with Playwright:

| Test Case | Path | Status |
|-----------|------|--------|
| TC1 | Happy Path — Full booking flow | ✅ Pass |
| TC2 | Error Handling — 409 Conflict | ✅ Pass |
| TC3 | Empty State — No slots available | ✅ Pass |
| TC4 | Mobile — iPhone 14 viewport | ✅ Pass |

**Location:** `e2e/tests/client-booking-flow.spec.ts`

---

## 📦 Archived Components

### Legacy Client PWA (Vite + React 18)
- **Status:** Archived ✅
- **Location:** `frontend/` (marked as DEPRECATED)
- **Migration:** All features moved to `frontend-next/`
- **CI:** `deploy-client-pwa.yml` workflow disabled

---

## 🔗 API Routes

### Client Endpoints (New PWA)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/client/services` | List services by category |
| GET | `/api/client/availability` | Available time slots |
| POST | `/api/client/book` | Create booking |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend (PWA) | Next.js 14, React 18, Tailwind CSS |
| Frontend (Legacy) | Vite + React 18 (archived) |
| Backend | Express.js, TypeScript |
| Database | PostgreSQL |
| Queue | BullMQ + Redis |
| AI | ML-based forecasting & market basket analysis |
| E2E Testing | Playwright |

---

## 📄 Documentation

- [Client PWA Architecture](../docs/client-pwa-architecture.md)
- [AI Services Spec](../docs/sprint3_ai_implementation_plan.md)
- [API Contract](../docs/backend_api_quick_reference.md)

---

*Built with the BMAD Method — Sprint 1 & 2*
