# 🔍 API Contract Integration Audit Report
## SalonOS Frontend - API Alignment & Type Safety Analysis

**Audit Date:** 2026-03-10  
**Auditor:** API Contract Integration Agent  
**Scope:** 6 core API/hook files

---

## 📊 Executive Summary

| Category | Status | Issues Found |
|----------|--------|--------------|
| TypeScript Interfaces | ⚠️ PARTIAL | 3 interfaces defined, 4 `any` type usages |
| Error Handling | ⚠️ INCONSISTENT | Mixed patterns, missing error boundaries |
| Loading States | ⚠️ MANUAL ONLY | No skeleton components, manual state management |
| API Client Config | ✅ BASIC | Functional but missing interceptors |
| TanStack Query | ❌ MISSING | Raw useEffect/fetch patterns throughout |
| Type Safety | ⚠️ GAPS | `any` types in critical data transformation paths |
| Resilient UI | ⚠️ PARTIAL | Fallbacks exist but no retry logic |

---

## 🚨 Critical Findings

### 1. TYPE SAFETY GAPS - HIGH SEVERITY

#### Finding 1.1: Unsafe `any` Types in Data Transformation
**File:** `src/core/api/utils.ts`  
**Line:** 1-10

```typescript
export function asArray<T = any>(value: any): T[] {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.rows)) return value.rows;
  // ... more any types
  return [];
}
```

**Risk:** Complete type bypass - no compile-time safety for API response shapes  
**Impact:** Runtime errors when API contract changes  
**Remediation:**
```typescript
// Define strict API response wrappers
interface ApiListResponse<T> {
  data?: T[];
  rows?: T[];
  forecast?: T[];
  heatmap?: T[];
  campaigns?: T[];
}

export function asArray<T>(value: unknown): T[] {
  if (!value || typeof value !== 'object') return [];
  
  const response = value as ApiListResponse<T>;
  if (Array.isArray(response.data)) return response.data;
  if (Array.isArray(response.rows)) return response.rows;
  if (Array.isArray(response.forecast)) return response.forecast;
  if (Array.isArray(response.heatmap)) return response.heatmap;
  if (Array.isArray(response.campaigns)) return response.campaigns;
  return [];
}
```

---

#### Finding 1.2: Implicit `any` in Dashboard Hook
**File:** `src/features/dashboard/hooks/useOwnerDashboard.ts`  
**Lines:** 4, 21, 22, 23

```typescript
const fallbackDashboard = { ... }  // No type annotation
export function useOwnerDashboard() {
  const [data, setData] = useState<any>(fallbackDashboard)  // any type
  // ...
  const res: any = await apiGet('/api/revenue/intelligence')  // any type
  const normalized = { ... }  // inferred any
}
```

**Risk:** No type checking on critical dashboard data  
**Impact:** Silent failures when API response shape changes  
**Remediation:**
```typescript
interface OwnerDashboardData {
  revenue_today: string;
  bookings_today: number;
  new_clients: number;
  upcoming: Array<{ id: string; start_time: string }>;
  trends: Array<{ day: string; revenue: number }>;
  rebookable_clients: Array<{ id: string; name: string; risk: 'high' | 'medium' | 'low' }>;
}

const fallbackDashboard: OwnerDashboardData = { ... }
```

---

### 2. ERROR HANDLING INCONSISTENCIES - MEDIUM SEVERITY

#### Finding 2.1: Inconsistent Error Type Handling
**Files:** Multiple hooks show different patterns

| File | Pattern | Issue |
|------|---------|-------|
| `useRevenueOpportunities.ts` | `err instanceof Error` | Good |
| `useRevenueIntelligence.ts` | `err: any` with `err?.message` | Unsafe access |
| `useOwnerDashboard.ts` | Silent catch with console.warn | No error exposure |

**Risk:** Users may not see errors; debugging is difficult  
**Remediation:** Standardize on discriminated union error type:

```typescript
// src/core/api/types.ts
export interface ApiError {
  type: 'network' | 'http' | 'parse' | 'unknown';
  message: string;
  status?: number;
  data?: unknown;
}

export function normalizeError(err: unknown): ApiError {
  if (err instanceof Error) {
    return {
      type: 'unknown',
      message: err.message,
    };
  }
  // ... handle ApiFetchError from client.ts
}
```

---

#### Finding 2.2: Missing Error Boundaries
**Files:** All hook files

No React Error Boundaries are implemented. If API calls throw during render, the entire component tree crashes.

**Remediation:**
```typescript
// src/core/components/ApiErrorBoundary.tsx
export class ApiErrorBoundary extends React.Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { hasError: boolean; error?: ApiError }
> {
  static getDerivedStateFromError(error: unknown) {
    return { hasError: true, error: normalizeError(error) };
  }
  // ... render fallback UI
}
```

---

### 3. MISSING TANSTACK QUERY - HIGH SEVERITY

#### Finding 3.1: Manual Fetch Anti-Patterns
**Files:** All 4 hook files

All hooks use raw `useEffect` + `fetch` patterns instead of TanStack Query:

```typescript
// ❌ ANTI-PATTERN in useRevenueIntelligence.ts
useEffect(() => {
  let active = true;
  async function load() {
    try {
      const res = await apiFetch<RevenueIntelligence>("/api/revenue/intelligence");
      if (active) setData(res);
    } catch (err: any) {
      if (active) setError(err?.message);
    }
  }
  load();
  const interval = setInterval(load, 60000); // Manual polling
  return () => { active = false; clearInterval(interval); };
}, []);
```

**Missing Features:**
- No caching (stale-while-revalidate)
- No automatic background refetching
- No deduplication of concurrent requests
- No retry logic with exponential backoff
- No query invalidation patterns
- Manual polling instead of smart refetching

**Remediation:** Migrate to TanStack Query v5:

```typescript
// src/features/dashboard/hooks/useRevenueIntelligence.ts
import { useQuery } from '@tanstack/react-query';

const REVENUE_INTELLIGENCE_KEY = ['revenue', 'intelligence'];

export function useRevenueIntelligence() {
  return useQuery({
    queryKey: REVENUE_INTELLIGENCE_KEY,
    queryFn: () => apiFetch<RevenueIntelligence>('/api/revenue/intelligence'),
    staleTime: 30 * 1000, // 30s
    refetchInterval: 60 * 1000, // 1min
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}
```

---

### 4. API CLIENT LIMITATIONS - MEDIUM SEVERITY

#### Finding 4.1: Missing Request/Response Interceptors
**File:** `src/core/api/client.ts`

Current implementation has no interceptor support for:
- Authentication token injection
- Request/response logging
- Metrics collection
- Automatic retry on 401 with token refresh

**Remediation:**
```typescript
// src/core/api/client.ts
interface Interceptors {
  request: Array<(config: RequestInit) => RequestInit | Promise<RequestInit>>;
  response: Array<(response: Response) => Response | Promise<Response>>;
}

export function createApiClient(baseConfig: { baseUrl: string; interceptors?: Interceptors }) {
  // Implementation with interceptor chain
}
```

---

#### Finding 4.2: No Request Timeout Handling
**File:** `src/core/api/client.ts`

`fetch()` has no timeout - requests can hang indefinitely.

**Remediation:**
```typescript
export async function apiFetch<T>(
  path: string, 
  init?: RequestInit & { timeout?: number }
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), init?.timeout || 30000);
  
  try {
    const response = await fetch(buildUrl(path), {
      ...init,
      signal: controller.signal,
    });
    // ... rest of implementation
  } finally {
    clearTimeout(timeoutId);
  }
}
```

---

### 5. LOADING STATE GAPS - MEDIUM SEVERITY

#### Finding 5.1: No Skeleton Components
**Files:** All hook files

Hooks return `loading: boolean` but no skeleton/placeholder data structures for progressive loading.

**Remediation:**
```typescript
// src/core/types/loading.ts
export type LoadingState<T> = 
  | { status: 'loading'; data: undefined; error: undefined }
  | { status: 'success'; data: T; error: undefined }
  | { status: 'error'; data: undefined; error: ApiError }
  | { status: 'revalidating'; data: T; error: undefined };

// Use with TanStack Query's `isLoading`, `isFetching` states
```

---

### 6. MISSING API CONTRACT VALIDATION - HIGH SEVERITY

#### Finding 6.1: No Runtime Schema Validation
**Files:** All API-consuming files

TypeScript interfaces provide compile-time safety only. No runtime validation that API responses match expected shapes.

**Remediation:** Use Zod for runtime validation:

```typescript
// src/core/api/schemas/revenue.ts
import { z } from 'zod';

export const RevenueIntelligenceSchema = z.object({
  generated_at: z.string().datetime(),
  pos: z.object({
    transactions_count: z.number().int().nonnegative(),
    gross_sales: z.number().nonnegative(),
    avg_ticket: z.number().nonnegative(),
  }),
  revenue_trend: z.array(z.object({
    day: z.string(),
    revenue: z.number(),
  })),
  opportunities: z.object({
    empty_slots_next_7_days: z.number().int(),
    rebookable_clients: z.number().int(),
  }),
});

export type RevenueIntelligence = z.infer<typeof RevenueIntelligenceSchema>;

// In apiFetch:
const parsed = RevenueIntelligenceSchema.parse(rawData);
```

---

## 📋 Remediation Priority Matrix

| Priority | Finding | Effort | Impact |
|----------|---------|--------|--------|
| 🔴 P0 | Add TanStack Query | Medium | High |
| 🔴 P0 | Runtime schema validation (Zod) | Medium | High |
| 🟡 P1 | Remove all `any` types | Low | Medium |
| 🟡 P1 | Standardize error handling | Low | Medium |
| 🟡 P1 | Add request timeouts | Low | Medium |
| 🟢 P2 | Add API interceptors | Medium | Low |
| 🟢 P2 | Implement Error Boundaries | Medium | Low |
| 🟢 P2 | Add skeleton components | Medium | Low |

---

## 🛠️ Recommended Implementation Order

### Phase 1: Foundation (Week 1)
1. Install dependencies: `@tanstack/react-query`, `zod`, `@tanstack/react-query-devtools`
2. Create `src/core/api/types.ts` with standardized error types
3. Add Zod schemas for all API contracts in `src/core/api/schemas/`
4. Wrap app with `QueryClientProvider`

### Phase 2: Migration (Week 2)
1. Migrate `useRevenueIntelligence` → `useRevenueIntelligenceQuery`
2. Migrate `useRevenueOpportunities` → `useRevenueOpportunitiesQuery`
3. Migrate `useOwnerDashboard` → `useOwnerDashboardQuery`
4. Add `useSalon` implementation (currently empty)

### Phase 3: Hardening (Week 3)
1. Remove all `any` types
2. Add API interceptors for auth/logging
3. Implement Error Boundaries
4. Add skeleton loading components

---

## 📁 Files Audited

| File | Lines | Critical Issues |
|------|-------|-----------------|
| `src/core/api/client.ts` | 58 | 2 (no timeout, no interceptors) |
| `src/core/api/utils.ts` | 10 | 2 (any types) |
| `src/core/hooks/useSalon.ts` | 0 | 1 (empty file) |
| `src/core/hooks/useRevenueOpportunities.ts` | 38 | 2 (no TanStack Query, manual fetch) |
| `src/features/dashboard/hooks/useOwnerDashboard.ts` | 42 | 3 (any types, no error exposure) |
| `src/features/dashboard/hooks/useRevenueIntelligence.ts` | 48 | 2 (manual polling, any error) |

---

## ✅ Success Criteria

- [ ] Zero `any` types in API layer
- [ ] All hooks migrated to TanStack Query
- [ ] Runtime validation with Zod on all API responses
- [ ] Standardized error handling with discriminated unions
- [ ] Request timeouts on all API calls
- [ ] Error boundaries around all data-dependent components
- [ ] Skeleton components for all loading states

---

*Report generated by API Contract Integration Agent for SalonOS Frontend Team*
