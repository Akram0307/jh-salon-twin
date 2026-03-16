# Backend API Quick Reference
## JH_SALON_TWIN - Owner HQ Integration

**Base URL**: `https://salonos-backend-rgvcleapsa-uc.a.run.app`  
**Local**: `http://localhost:8080`  
**Auth**: JWT Bearer Token  

---

## Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/login` | POST | Owner login |
| `/api/auth/staff-login` | POST | Staff login |
| `/api/auth/refresh` | POST | Refresh token |
| `/api/auth/me` | GET | Current user |
| `/api/auth/logout` | POST | Logout |

---

## Dashboard & Analytics

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/analytics/overview` | GET | Dashboard overview |
| `/api/analytics/revenue-summary` | GET | Revenue summary |
| `/api/analytics/staff-performance` | GET | Staff performance |
| `/api/analytics/upcoming` | GET | Upcoming appointments |
| `/api/analytics/revenue?period=week` | GET | Revenue by period |
| `/api/owner/system-health` | GET | System health |
| `/api/owner/schedule-summary` | GET | Schedule summary |

---

## Appointments

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/appointments` | GET | List appointments |
| `/api/appointments/today` | GET | Today's appointments |
| `/api/appointments` | POST | Create appointment |
| `/api/appointments/:id/status` | PATCH | Update status |
| `/api/appointments/:id/reschedule` | PATCH | Reschedule |
| `/api/appointments/:id/send-reminder` | POST | Send reminder |
| `/api/appointments/slots` | GET | Available slots |

**Statuses**: `booked`, `arrived`, `in_progress`, `completed`, `cancelled`, `no_show`

---

## Clients

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/clients` | GET | List clients |
| `/api/clients` | POST | Create client |
| `/api/clients/:id/profile` | GET | Beauty profile |
| `/api/clients/:id/profile` | POST | Create profile |
| `/api/clients/:id/profile` | PATCH | Update profile |
| `/api/clients/search` | GET | Search clients |

---

## Staff

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/staff` | GET | List staff |
| `/api/staff` | POST | Create staff |
| `/api/staff/:id` | PUT | Update staff |
| `/api/staff/:id` | DELETE | Delete staff |
| `/api/staff/:id/schedule` | GET | Staff schedule |
| `/api/staff/:id/performance` | GET | Performance |
| `/api/staff/:id/availability` | GET | Availability |

---

## Services

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/services` | GET | List services |
| `/api/services` | POST | Create service |
| `/api/services/:id` | PUT | Update service |
| `/api/services/:id` | DELETE | Delete service |
| `/api/services/categories` | GET | Categories |

---

## Revenue & Payments

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/revenue` | GET | Revenue data |
| `/api/revenue-actions` | POST | Revenue actions |
| `/api/payments` | GET | Payment history |
| `/api/payments` | POST | Process payment |

---

## AI & Automation

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ai/forecast` | POST | AI forecasting |
| `/api/ai-concierge` | POST | AI concierge |
| `/api/ai-campaigns` | POST | AI campaigns |

---

## Settings

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/settings` | GET | Get settings |
| `/api/settings` | PUT | Update settings |
| `/api/salon-settings` | GET | Salon settings |
| `/api/salon-settings` | PUT | Update salon settings |

---

## Notifications & Activity

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/notifications` | GET | Notifications |
| `/api/activity` | GET | Activity log |
| `/api/action-history` | GET | Action history |

---

## Health & Diagnostics

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Basic health |
| `/api/health/detailed` | GET | Detailed health |
| `/api/diagnostics` | GET | Diagnostics |
| `/api/admin/errors/stats` | GET | Error stats |

---

## Missing Endpoints (Need Implementation)

| Endpoint | Priority | Description |
|----------|----------|-------------|
| `/api/dashboard/kpis` | High | Dashboard KPIs |
| `/api/alerts` | High | Real-time alerts |
| `/api/analytics/service-performance` | High | Service analytics |
| `/api/analytics/client-metrics` | Medium | Client metrics |
| `/api/staff/schedule` | Medium | General staff schedule |
| `/api/clients/:id/history` | Medium | Client history |
| `/api/clients/:id/preferences` | Low | Client preferences |

---

## Environment Variables

**Frontend**:
- `NEXT_PUBLIC_API_BASE_URL` - Backend API URL
- `NEXT_PUBLIC_SALON_ID` - Salon ID

**Backend**:
- `DATABASE_URL` - PostgreSQL connection
- `REDIS_URL` - Redis connection
- `JWT_SECRET` - JWT secret
- `SALON_ID` - Default salon ID

---

## Quick Test Commands

```bash
# Health check
curl https://salonos-backend-rgvcleapsa-uc.a.run.app/health

# Login
curl -X POST https://salonos-backend-rgvcleapsa-uc.a.run.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@example.com","password":"password"}'

# Dashboard data (with token)
curl -H "Authorization: Bearer <token>" \
  https://salonos-backend-rgvcleapsa-uc.a.run.app/api/analytics/overview
```

---

*Last Updated: 2026-03-16*  
*Backend Architect Team*
