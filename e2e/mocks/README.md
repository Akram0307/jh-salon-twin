# SalonOS Mock API Server

A comprehensive mock Express.js server for E2E testing that eliminates all backend dependencies.

## Quick Start

```bash
MOCK_API_PORT=4000 npx tsx e2e/mocks/server.ts
```

Or with default port (4000):

```bash
npx tsx e2e/mocks/server.ts
```

## Configuration

| Env Variable | Default | Description |
|---|---|---|
| `MOCK_API_PORT` | `4000` | Port to listen on |

## Authentication

The mock server accepts **any** JWT token in the `Authorization: Bearer <token>` header.
If the token is a valid JWT with an `id` and `email` in its payload, those values are used;
otherwise a default test user is returned.

**Test User:**
- ID: `user-001`
- Name: `Test Owner`
- Email: `test@salon.com`
- Role: `owner`
- User Type: `owner`
- Salon ID: `b0dcbd9e-1ca0-450e-a299-7ad239f848f4`

## CORS

Configured for `http://localhost:3000` with credentials enabled.

## Endpoints

### Health
| Method | Path | Description | Response Format |
|---|---|---|---|
| GET | `/api/health` | Health check | `{ status: "ok" }` |

### Auth (no auth required)
| Method | Path | Description | Response Format |
|---|---|---|---|
| POST | `/api/auth/login` | Login | Flat object with token, refresh_token, user |
| POST | `/api/auth/refresh` | Refresh token | Flat object with token |
| POST | `/api/auth/forgot-password` | Forgot password | Flat object with message |
| POST | `/api/auth/reset-password` | Reset password | Flat object with message |
| GET | `/api/auth/me` | Get current user | Flat user object |

### Dashboard (auth required)
| Method | Path | Description | Response Format |
|---|---|---|---|
| GET | `/api/dashboard/stats` | Dashboard statistics | ApiEnvelope with meta.salon_id |
| GET | `/api/dashboard/recent-activity` | Recent activity feed | ApiEnvelope with meta.salon_id |

### Alerts & Notifications (auth required)
| Method | Path | Description | Response Format |
|---|---|---|---|
| GET | `/api/alerts` | System alerts | ApiEnvelope with meta.salon_id |
| GET | `/api/notifications` | User notifications | ApiEnvelope |

### Appointments (auth required)
| Method | Path | Description | Response Format |
|---|---|---|---|
| GET | `/api/appointments` | List appointments | Raw array |
| POST | `/api/appointments` | Create appointment | Raw object (201) |
| PATCH | `/api/appointments/:id/status` | Update status | Raw object |
| DELETE | `/api/appointments/:id` | Delete appointment | `{ success: true }` |
| GET | `/api/appointments/:id/services` | Get appointment services | Raw array |
| POST | `/api/appointments/:id/services` | Add service to appointment | Raw object (201) |

### Clients (auth required)
| Method | Path | Description | Response Format |
|---|---|---|---|
| GET | `/api/clients` | List clients | Raw array |
| GET | `/api/clients/:id` | Get client | Raw object |
| POST | `/api/clients/export` | Export clients CSV | CSV text with Content-Disposition |

### Services (auth required)
| Method | Path | Description | Response Format |
|---|---|---|---|
| GET | `/api/services` | List services | ApiEnvelope |
| GET | `/api/services/categories` | List service categories | ApiEnvelope |

### Staff (auth required)
| Method | Path | Description | Response Format |
|---|---|---|---|
| GET | `/api/staff` | List staff | ApiEnvelope |
| GET | `/api/staff/:id/availability` | Get staff availability | ApiEnvelope |

### POS (auth required)
| Method | Path | Description | Response Format |
|---|---|---|---|
| POST | `/api/pos/create-draft` | Create draft order | Raw object |
| POST | `/api/pos/complete-transaction` | Complete transaction | Raw object |
| GET | `/api/pos/z-report` | Z-report summary | ApiEnvelope |

### AI Concierge (auth required)
| Method | Path | Description | Response Format |
|---|---|---|---|
| POST | `/api/ai/concierge/chat` | Send chat message | ApiEnvelope |
| GET | `/api/ai/concierge/history` | Chat history | ApiEnvelope |

## Test Data

- **10 appointments** spread 9:00-17:00, including 2 overlapping (appt-003 & appt-004 for Maria Gonzalez)
- **18 clients** with realistic names, emails, and phone numbers
- **12 services** across 4 categories (Hair, Nails, Skin, Body), $25-$150, 15-120 min
- **6 staff** members with distinct roles and specialties

## Response Format Notes

The mock server mirrors the exact response formats of the real backend:

- **Auth routes**: Flat objects, no envelope wrapper
- **Appointments/Clients**: Raw arrays or objects, no envelope
- **Dashboard/Alerts/Services/Staff/Notifications/AI**: ApiEnvelope (`{ success, data, message, error, meta }`)
- **POS**: Mixed — raw objects for draft/complete, envelope for z-report

## Logging

All requests are logged to stderr:
```
[MOCK] GET /api/health -> 200
[MOCK] POST /api/auth/login -> 200
```

## Shutdown

Clean shutdown on SIGTERM/SIGINT with 5-second forced shutdown timeout.
