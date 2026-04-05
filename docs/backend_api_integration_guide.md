# Backend API Documentation & Integration Guide
## JH_SALON_TWIN - Owner HQ Integration

### Overview
This document provides comprehensive documentation for the SalonOS Backend API and integration guidelines for the frontend-next (Owner HQ) application.

**Backend Base URL**: `https://salonos-backend-rgvcleapsa-uc.a.run.app` (Production)  
**Local Development**: `http://localhost:8080`  
**API Version**: v1  
**Authentication**: JWT Bearer Token  

---

## 1. Authentication & Authorization

### 1.1 Authentication Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| POST | `/api/auth/login` | Owner login | `{ email, password }` | `{ token, refresh_token, user }` |
| POST | `/api/auth/staff-login` | Staff login | `{ email, password }` | `{ token, refresh_token, user }` |
| POST | `/api/auth/refresh` | Refresh JWT token | `{ refresh_token }` | `{ token }` |
| GET | `/api/auth/me` | Get current user | - | `{ user }` |
| POST | `/api/auth/logout` | Logout | - | `{ success }` |

### 1.2 Authentication Flow
1. **Login**: POST to `/api/auth/login` with credentials
2. **Token Storage**: Store `token` in Authorization header as `Bearer <token>`
3. **Token Refresh**: Use `/api/auth/refresh` when token expires (1 hour)
4. **Logout**: POST to `/api/auth/logout` to invalidate session

### 1.3 Token Structure
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "name": "Owner Name",
    "email": "owner@example.com",
    "phone": "+1234567890",
    "role": "owner",
    "user_type": "owner"
  }
}
```

---

## 2. API Endpoints by Category

### 2.1 Owner & Dashboard

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/owner/system-health` | System health check | Yes |
| GET | `/api/owner/schedule-summary` | Schedule summary | Yes |
| POST | `/api/owner` | Create owner | No |

### 2.2 Analytics & Dashboard

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/analytics/overview` | Dashboard overview | Yes |
| GET | `/api/analytics/revenue-summary` | Revenue summary | Yes |
| GET | `/api/analytics/staff-performance` | Staff performance | Yes |
| GET | `/api/analytics/upcoming` | Upcoming appointments | Yes |
| GET | `/api/analytics/revenue?period=week` | Revenue by period | Yes |

**Response Example - Overview**:
```json
{
  "revenue_today": 15000.00,
  "bookings_today": 25,
  "new_clients": 5,
  "upcoming": [
    {
      "id": "uuid",
      "appointment_time": "2026-03-16T14:00:00Z",
      "status": "booked"
    }
  ],
  "staff": [
    {
      "id": "uuid",
      "full_name": "John Doe",
      "appointments_today": 8
    }
  ]
}
```

### 2.3 Appointments

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/appointments` | List all appointments | Yes |
| GET | `/api/appointments/today` | Today's appointments | Yes |
| POST | `/api/appointments` | Create appointment | Yes |
| PATCH | `/api/appointments/:id/status` | Update status | Yes |
| GET | `/api/appointments/qr/:token` | Get by QR token | No |
| POST | `/api/appointments/:id/services` | Add service | Yes |
| PATCH | `/api/appointments/:id/services/:serviceId` | Update service price | Yes |
| POST | `/api/appointments/:id/send-reminder` | Send reminder | Yes |
| PATCH | `/api/appointments/:id/reschedule` | Reschedule | Yes |
| GET | `/api/appointments/slots` | Get available slots | No |

**Appointment Statuses**: `booked`, `arrived`, `in_progress`, `completed`, `cancelled`, `no_show`

### 2.4 Clients

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/clients` | List all clients | Yes |
| POST | `/api/clients` | Create client | Yes |
| GET | `/api/clients/:id/profile` | Get beauty profile | Yes |
| POST | `/api/clients/:id/profile` | Create beauty profile | Yes |
| PATCH | `/api/clients/:id/profile` | Update beauty profile | Yes |
| GET | `/api/clients/search` | Search clients | Yes |

### 2.5 Staff Management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/staff` | List all staff | Yes |
| POST | `/api/staff` | Create staff | Yes |
| PUT | `/api/staff/:id` | Update staff | Yes |
| DELETE | `/api/staff/:id` | Delete staff | Yes |
| GET | `/api/staff/:id/schedule` | Get staff schedule | Yes |
| GET | `/api/staff/:id/performance` | Get performance | Yes |
| GET | `/api/staff/:id/availability` | Check availability | Yes |

### 2.6 Services

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/services` | List all services | Yes |
| POST | `/api/services` | Create service | Yes |
| PUT | `/api/services/:id` | Update service | Yes |
| DELETE | `/api/services/:id` | Delete service | Yes |
| GET | `/api/services/categories` | Get categories | Yes |

### 2.7 Revenue & Payments

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/revenue` | Revenue data | Yes |
| POST | `/api/revenue-actions` | Revenue actions | Yes |
| GET | `/api/payments` | Payment history | Yes |
| POST | `/api/payments` | Process payment | Yes |

### 2.8 AI & Automation

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/ai/forecast` | AI forecasting | Yes |
| POST | `/api/ai-concierge` | AI concierge | Yes |
| POST | `/api/ai-campaigns` | AI campaigns | Yes |

### 2.9 Settings & Configuration

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/settings` | Get settings | Yes |
| PUT | `/api/settings` | Update settings | Yes |
| GET | `/api/salon-settings` | Salon settings | Yes |
| PUT | `/api/salon-settings` | Update salon settings | Yes |

### 2.10 Notifications & Activity

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/notifications` | Get notifications | Yes |
| GET | `/api/activity` | Activity log | Yes |
| GET | `/api/action-history` | Action history | Yes |

### 2.11 Health & Diagnostics

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/health` | Basic health check | No |
| GET | `/api/health/detailed` | Detailed health | No |
| GET | `/api/diagnostics` | Diagnostics | Yes |
| GET | `/api/admin/errors/stats` | Error statistics | Yes |

---

## 3. Database Schema Overview

### 3.1 Core Tables

**Multi-Tenant Structure**:
- `owners` - Salon owners
- `salons` - Salon locations
- `staff` - Staff members (linked to salon)
- `clients` - Clients (linked to salon)
- `services` - Services offered (linked to salon)
- `appointments` - Appointments (linked to salon)

**Key Relationships**:
```
owners (1) → (N) salons
salons (1) → (N) staff
salons (1) → (N) clients
salons (1) → (N) services
salons (1) → (N) appointments
appointments (N) → (N) services (via appointment_services)
```

### 3.2 Important Tables for Owner HQ

1. **appointments** - Core booking data
2. **clients** - Client information
3. **staff** - Staff management
4. **services** - Service catalog
5. **transactions** - Revenue tracking
6. **staff_working_hours** - Staff schedules
7. **client_beauty_profiles** - Client preferences

### 3.3 Multi-Tenancy
All queries must include `salon_id` for data isolation. The backend uses `SALON_ID` environment variable for default salon context.

---

## 4. Frontend-Next Integration Guide

### 4.1 API Client Configuration

**File**: `src/lib/api-client.ts`
```typescript
import { API_CONFIG } from './api-endpoints';

const apiClient = {
  baseUrl: API_CONFIG.baseUrl,
  timeout: API_CONFIG.timeout,
  
  async request(endpoint: string, options: RequestInit = {}) {
    const token = localStorage.getItem('auth_token');
    
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
      signal: AbortSignal.timeout(this.timeout),
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    return response.json();
  },
  
  get(endpoint: string) {
    return this.request(endpoint);
  },
  
  post(endpoint: string, data: any) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  put(endpoint: string, data: any) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  
  patch(endpoint: string, data: any) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
  
  delete(endpoint: string) {
    return this.request(endpoint, {
      method: 'DELETE',
    });
  },
};

export default apiClient;
```

### 4.2 Environment Configuration

**File**: `.env.local`
```env
NEXT_PUBLIC_API_BASE_URL=https://salonos-backend-rgvcleapsa-uc.a.run.app
NEXT_PUBLIC_SALON_ID=b0dcbd9e-1ca0-450e-a299-7ad239f848f4
```

### 4.3 Authentication Integration

**Login Component**:
```typescript
import { AUTH_ENDPOINTS } from '@/lib/api-endpoints';
import apiClient from '@/lib/api-client';

const login = async (email: string, password: string) => {
  const response = await apiClient.post(AUTH_ENDPOINTS.login, {
    email,
    password,
  });
  
  localStorage.setItem('auth_token', response.token);
  localStorage.setItem('refresh_token', response.refresh_token);
  localStorage.setItem('user', JSON.stringify(response.user));
  
  return response;
};
```

### 4.4 Dashboard Data Integration

**Dashboard Hook**:
```typescript
import { ANALYTICS_ENDPOINTS } from '@/lib/api-endpoints';
import apiClient from '@/lib/api-client';
import { useQuery } from '@tanstack/react-query';

export const useDashboardData = () => {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const [overview, revenue, staffPerformance] = await Promise.all([
        apiClient.get(ANALYTICS_ENDPOINTS.overview),
        apiClient.get(ANALYTICS_ENDPOINTS.revenue),
        apiClient.get(ANALYTICS_ENDPOINTS.staffPerformance),
      ]);
      
      return {
        overview,
        revenue,
        staffPerformance,
      };
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
};
```

### 4.5 Appointment Management Integration

**Appointment Service**:
```typescript
import { APPOINTMENT_ENDPOINTS } from '@/lib/api-endpoints';
import apiClient from '@/lib/api-client';

export const appointmentService = {
  getToday: () => apiClient.get(APPOINTMENT_ENDPOINTS.today),
  
  create: (appointmentData: any) => 
    apiClient.post(APPOINTMENT_ENDPOINTS.create, appointmentData),
  
  updateStatus: (id: string, status: string) =>
    apiClient.patch(APPOINTMENT_ENDPOINTS.byId(id), { status }),
  
  reschedule: (id: string, newTime: string) =>
    apiClient.patch(APPOINTMENT_ENDPOINTS.reschedule(id), { 
      newStartTime: newTime 
    }),
  
  getAvailableSlots: (serviceId: string, date: string) =>
    apiClient.get(`${APPOINTMENT_ENDPOINTS.slots}?service_id=${serviceId}&date=${date}`),
};
```

### 4.6 Error Handling

**Global Error Handler**:
```typescript
// src/lib/error-handler.ts
export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public data?: any
  ) {
    super(message);
  }
}

export const handleApiError = (error: any) => {
  if (error.status === 401) {
    // Redirect to login
    window.location.href = '/login';
  }
  
  if (error.status === 403) {
    // Show permission error
    console.error('Permission denied');
  }
  
  if (error.status >= 500) {
    // Show server error
    console.error('Server error');
  }
};
```

---

## 5. Missing Endpoints & Gaps

### 5.1 Identified Gaps for Owner HQ

1. **Dashboard KPIs**: `/api/dashboard/kpis` endpoint not found in backend
2. **Alerts**: `/api/alerts` endpoint not found
3. **Service Performance**: `/api/analytics/service-performance` not implemented
4. **Client Metrics**: `/api/analytics/client-metrics` not implemented
5. **Staff Schedule**: `/api/staff/schedule` (general) not implemented
6. **Client History**: `/api/clients/:id/history` not implemented
7. **Client Preferences**: `/api/clients/:id/preferences` not implemented

### 5.2 Recommended Implementations

**Priority 1 (Critical)**:
1. Implement `/api/dashboard/kpis` for Owner HQ dashboard
2. Implement `/api/alerts` for real-time notifications
3. Add `/api/analytics/service-performance` for service analytics

**Priority 2 (Important)**:
1. Implement `/api/analytics/client-metrics` for client insights
2. Add `/api/staff/schedule` for general staff scheduling
3. Implement `/api/clients/:id/history` for client history

**Priority 3 (Enhancement)**:
1. Add `/api/clients/:id/preferences` for client preferences
2. Implement WebSocket support for real-time updates
3. Add batch operations for appointments and clients

---

## 6. Testing & Validation

### 6.1 Health Check
```bash
curl https://salonos-backend-rgvcleapsa-uc.a.run.app/health
```

### 6.2 Authentication Test
```bash
curl -X POST https://salonos-backend-rgvcleapsa-uc.a.run.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@example.com","password":"password"}'
```

### 6.3 Dashboard Data Test
```bash
curl -H "Authorization: Bearer <token>" \
  https://salonos-backend-rgvcleapsa-uc.a.run.app/api/analytics/overview
```

---

## 7. Deployment & Configuration

### 7.1 Backend Environment Variables
Required for backend:
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - JWT signing secret
- `SALON_ID` - Default salon ID
- `NODE_ENV` - Environment (development/production)

### 7.2 Frontend Environment Variables
Required for frontend-next:
- `NEXT_PUBLIC_API_BASE_URL` - Backend API URL
- `NEXT_PUBLIC_SALON_ID` - Salon ID for multi-tenancy

### 7.3 CORS Configuration
Backend allows requests from:
- `http://localhost:3000` (development)
- `https://salonos-frontend-next-rgvcleapsa-uc.a.run.app` (production)

---

## 8. Security Considerations

### 8.1 Authentication
- JWT tokens expire in 1 hour
- Refresh tokens expire in 7 days
- Store tokens securely (httpOnly cookies recommended)

### 8.2 Data Protection
- All API calls use HTTPS in production
- Sensitive data encrypted at rest
- SQL injection protection via parameterized queries

### 8.3 Rate Limiting
- API endpoints have rate limiting (100 requests/minute)
- Authentication endpoints have stricter limits

---

## 9. Support & Troubleshooting

### 9.1 Common Issues

**401 Unauthorized**:
- Check token expiration
- Verify Authorization header format
- Ensure user has correct permissions

**404 Not Found**:
- Verify endpoint URL
- Check if resource exists
- Ensure correct HTTP method

**500 Server Error**:
- Check backend logs
- Verify database connectivity
- Ensure all environment variables are set

### 9.2 Debugging Tools

1. **Backend Logs**: Check Cloud Run logs
2. **Network Tab**: Monitor API requests in browser
3. **Health Endpoints**: Use `/health` and `/api/health/detailed`

### 9.3 Contact
For backend issues, contact the Backend Architect team.
For frontend integration issues, contact the Frontend Architect team.

---

## 10. Next Steps

1. **Immediate**: Implement missing Priority 1 endpoints
2. **Short-term**: Add WebSocket support for real-time updates
3. **Medium-term**: Implement batch operations and advanced analytics
4. **Long-term**: Add GraphQL support for flexible queries

---

*Document Version: 1.0*  
*Last Updated: 2026-03-16*  
*Author: Backend Architect Team*  
*Status: Ready for Integration*
