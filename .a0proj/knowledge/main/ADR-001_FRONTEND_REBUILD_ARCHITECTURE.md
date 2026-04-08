# Frontend Architecture Decision Record (ADR-001)
## SalonOS Fresh Rebuild - Technical Foundation

**Date**: 2026-03-12
**Author**: Frontend Architect
**Status**: Approved
**Previous UI Score**: 6.2/10 → **Target**: 9+/10

---

## Executive Summary

This ADR defines the technical foundation for a fresh SalonOS frontend rebuild, optimized for the "Operational Luxury" design philosophy. Every decision is made to prevent the previous issues: hardcoded values, inconsistent styling, poor test coverage, and excessive TypeScript `any` usage.

---

## 1. Optimal Tech Stack Recommendation

### Primary Stack: **Next.js 14 + React 18 + TypeScript 5.4**

| Layer | Technology | Justification |
|-------|------------|---------------|
| **Framework** | Next.js 14 (App Router) | SSR/SSG for Client PWA SEO, RSC for Owner HQ data-heavy surfaces, built-in API routes for BFF pattern |
| **UI Library** | React 18 | Concurrent features, Suspense, useTransition for smooth UX |
| **Language** | TypeScript 5.4 (strict mode) | Eliminates `any` types, satisfies previous tech debt |
| **Styling** | TailwindCSS 3.4 + CSS Modules | Utility-first with design tokens, CSS Modules for complex animations |
| **Component Library** | shadcn/ui (Radix primitives) | Accessible, customizable, no runtime overhead |
| **State Management** | Zustand + TanStack Query | Lightweight global state + server state separation |
| **Forms** | React Hook Form + Zod | Type-safe validation, minimal re-renders |
| **Testing** | Vitest + Playwright + Testing Library | Fast unit tests, reliable E2E, component testing |
| **Build** | Turbopack (dev) + Webpack (prod) | Fast HMR in dev, stable production builds |
| **Package Manager** | pnpm | Fast, disk-efficient, strict dependency resolution |

### Why NOT Vite?

While Vite served well previously, Next.js provides:
- **Built-in SSR/SSG** for Client PWA (critical for luxury brand SEO)
- **Image optimization** (automatic WebP/AVIF conversion)
- **API routes** for BFF pattern (reduces direct backend coupling)
- **Middleware** for auth, A/B testing, geo-routing
- **React Server Components** for Owner HQ data-heavy dashboards

### Why NOT Remix?

- Next.js has larger ecosystem, more shadcn/ui examples
- App Router provides similar nested layouts
- Better Vercel/GCP Cloud Run deployment support

---

## 2. Component Architecture Approach

### Hybrid: **Feature-Based + Atomic Design**

```
src/
├── app/                          # Next.js App Router (pages)
│   ├── (owner)/                  # Owner HQ route group
│   │   ├── layout.tsx            # Dark-mode fintech cockpit shell
│   │   ├── dashboard/
│   │   ├── revenue/
│   │   └── settings/
│   ├── (staff)/                  # Staff Workspace route group
│   │   ├── layout.tsx            # Touch-optimized shell
│   │   ├── schedule/
│   │   └── clients/
│   └── (client)/                 # Client PWA route group
│       ├── layout.tsx            # Premium concierge shell
│       ├── book/
│       └── profile/
├── components/
│   ├── ui/                       # shadcn/ui primitives (atomic)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   └── ...
│   ├── shared/                   # Cross-surface components
│   │   ├── GlassCard/
│   │   ├── KpiPulse/
│   │   └── CommandBar/
│   └── surface-specific/         # Surface-isolated components
│       ├── owner/
│       ├── staff/
│       └── client/
├── features/                     # Feature modules (business logic)
│   ├── booking/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── api/
│   │   ├── stores/
│   │   └── types/
│   ├── revenue/
│   ├── ai-concierge/
│   └── ...
├── lib/                          # Utilities & config
│   ├── design-tokens.ts          # Three-tier token system
│   ├── utils.ts                  # cn(), formatters
│   └── api-client.ts             # Typed API client
├── hooks/                        # Global hooks
├── stores/                       # Zustand stores
└── types/                        # Global TypeScript types
```

### Key Principles:

1. **Surface Isolation**: Owner HQ, Staff Workspace, Client PWA have separate layouts and route groups
2. **Feature Modules**: Business logic grouped by domain (booking, revenue, ai-concierge)
3. **Component Hierarchy**: ui/ → shared/ → surface-specific/ → feature components
4. **Co-location**: Hooks, types, and API calls live with their feature components
5. **Barrel Exports**: Each feature exports via `index.ts` for clean imports

---

## 3. Three-Tier Design Token Implementation Strategy

### Token Architecture

```typescript
// lib/design-tokens.ts

// TIER 1: PRIMITIVE (Raw values - never used directly in components)
export const primitive = {
  colors: {
    // OKLCH color space for perceptual uniformity
    slate: {
      950: 'oklch(0.129 0.014 264.695)',  // Deepest dark
      900: 'oklch(0.196 0.021 264.695)',
      800: 'oklch(0.279 0.029 264.695)',
      // ...
    },
    gold: {
      400: 'oklch(0.831 0.162 84.429)',   // Luxury accent
      500: 'oklch(0.769 0.178 84.429)',
    },
    rose: {
      400: 'oklch(0.712 0.194 13.428)',   // Warm accent
    },
  },
  spacing: { /* ... */ },
  radius: { /* ... */ },
  blur: { /* ... */ },
} as const;

// TIER 2: SEMANTIC (Meaningful aliases - used in layouts)
export const semantic = {
  // Owner HQ (Dark Mode)
  owner: {
    surface: {
      primary: primitive.colors.slate[950],
      secondary: primitive.colors.slate[900],
      elevated: primitive.colors.slate[800],
    },
    text: {
      primary: 'oklch(0.985 0 0)',
      secondary: 'oklch(0.708 0 0)',
      muted: 'oklch(0.556 0 0)',
    },
    accent: {
      primary: primitive.colors.gold[400],
      success: 'oklch(0.723 0.219 149.579)',
      warning: 'oklch(0.828 0.189 84.429)',
      danger: 'oklch(0.637 0.237 25.331)',
    },
    glass: {
      subtle: 'bg-white/[0.03] backdrop-blur-xl border-white/[0.06]',
      medium: 'bg-white/[0.06] backdrop-blur-xl border-white/[0.10]',
      strong: 'bg-white/[0.10] backdrop-blur-xl border-white/[0.15]',
    },
  },
  // Client PWA (Light Mode)
  client: {
    surface: {
      primary: 'oklch(0.991 0.003 56.375)',  // Warm white
      secondary: 'oklch(0.967 0.005 56.375)',
    },
    text: {
      primary: 'oklch(0.208 0.029 264.695)',
      secondary: 'oklch(0.446 0.026 264.695)',
    },
    accent: {
      primary: primitive.colors.rose[400],
    },
  },
} as const;

// TIER 3: COMPONENT (Specific values - used in component variants)
export const component = {
  kpiCard: {
    background: semantic.owner.glass.subtle,
    border: 'border-white/[0.06]',
    radius: 'rounded-xl',
    padding: 'p-5',
    numberFont: 'font-mono tabular-nums',
  },
  executeButton: {
    background: 'bg-gradient-to-r from-gold-400 to-gold-500',
    text: 'text-slate-950 font-semibold',
    radius: 'rounded-full',
    shadow: 'shadow-lg shadow-gold-400/20',
  },
  commandBar: {
    background: semantic.owner.glass.medium,
    height: 'h-14',
    blur: 'backdrop-blur-2xl',
  },
} as const;
```

### Enforcement Strategy:

1. **ESLint Rule**: Custom rule forbidding hardcoded color values in className
2. **Tailwind Config**: Extend theme with token values, use `@apply` sparingly
3. **Type Safety**: Export types for all tokens, use `satisfies` for validation
4. **CI Check**: Script that greps for hardcoded patterns (`bg-white/5`, `#000`, etc.)
5. **Storybook**: Visual regression tests for all token combinations

### Migration Path:

```bash
# Audit script for remaining hardcoded values
pnpm audit:tokens

# Output: List of files with hardcoded values
# src/components/OwnerDashboard.tsx:42 - hardcoded 'bg-white/5'
# src/components/KpiCard.tsx:18 - hardcoded '#000'
```

---

## 4. shadcn/ui Component Selection & Customization

### Core Components (Install First)

| Component | Surface | Customization |
|-----------|---------|---------------|
| `button` | All | Add `glass`, `execute`, `luxury` variants |
| `card` | All | Glassmorphism variants via `glass.subtle/medium/strong` |
| `dialog` | Owner, Staff | Dark mode styling, blur backdrop |
| `sheet` | All | Slide-over panels for mobile |
| `tabs` | Owner | Revenue tabs, data views |
| `table` | Owner | Dense data tables, sortable, filterable |
| `select` | All | Custom dropdown styling |
| `input` | All | Form inputs with validation states |
| `badge` | All | Status indicators |
| `avatar` | All | Staff/client photos |
| `skeleton` | All | Loading states (critical for perceived performance) |
| `toast` | All | Notifications |
| `dropdown-menu` | All | Context menus |
| `popover` | All | Tooltips, quick actions |
| `command` | Owner | Command palette (Cmd+K) |
| `calendar` | Staff, Client | Date picker |
| `separator` | All | Visual dividers |

### Extended Components (Phase 2)

| Component | Purpose |
|-----------|---------|
| `data-table` | Advanced tables with TanStack Table |
| `chart` | Revenue visualizations (Recharts wrapper) |
| `carousel` | Client PWA service galleries |
| `accordion` | FAQ, settings panels |
| `navigation-menu` | Owner HQ mega-nav |
| `menubar` | Staff workspace actions |

### Customization Approach

```typescript
// components/ui/button.tsx (extended)
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center...',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground...',
        destructive: 'bg-destructive...',
        outline: 'border border-input...',
        secondary: 'bg-secondary...',
        ghost: 'hover:bg-accent...',
        link: 'text-primary underline-offset-4...',
        // SalonOS custom variants
        glass: cn(
          semantic.owner.glass.subtle,
          'hover:bg-white/[0.06] transition-all duration-200'
        ),
        execute: cn(
          component.executeButton.background,
          component.executeButton.text,
          component.executeButton.radius,
          component.executeButton.shadow,
          'hover:scale-[1.02] active:scale-[0.98] transition-transform'
        ),
        luxury: cn(
          'bg-gradient-to-r from-rose-400 to-rose-500',
          'text-white font-medium',
          'shadow-lg shadow-rose-400/20',
          'hover:shadow-xl hover:shadow-rose-400/30',
          'transition-all duration-300'
        ),
      },
    },
  }
);
```

### Component Governance:

1. **Never modify shadcn/ui source directly** - extend via variants
2. **All custom components** must use design tokens
3. **Storybook stories** required for every component
4. **Accessibility audit** via axe-core in CI

---

## 5. Build, Test, and Deployment Pipeline

### Development Workflow

```bash
# Local development
pnpm dev              # Turbopack for fast HMR
pnpm dev:owner        # Owner HQ only
pnpm dev:staff        # Staff Workspace only
pnpm dev:client       # Client PWA only

# Code quality
pnpm lint             # ESLint + Prettier
pnpm type-check       # TypeScript strict mode
pnpm audit:tokens     # Design token compliance

# Testing
pnpm test             # Vitest unit tests
pnpm test:watch       # Watch mode
pnpm test:e2e         # Playwright E2E
pnpm test:visual      # Visual regression
```

### CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/frontend-ci.yml
name: Frontend CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Type check
        run: pnpm type-check

      - name: Lint
        run: pnpm lint

      - name: Design token audit
        run: pnpm audit:tokens

      - name: Unit tests
        run: pnpm test --coverage

      - name: Build
        run: pnpm build
        env:
          NEXT_PUBLIC_API_URL: ${{ secrets.API_URL }}

      - name: Upload coverage
        uses: codecov/codecov-action@v3

  e2e:
    needs: quality
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      # ... setup ...

      - name: Install Playwright
        run: pnpm playwright install --with-deps

      - name: Run E2E tests
        run: pnpm test:e2e

      - name: Upload test results
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/

  deploy:
    needs: [quality, e2e]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Cloud Run
        run: |
          gcloud run deploy salonos-frontend             --image gcr.io/${{ secrets.GCP_PROJECT }}/salonos-frontend:${{ github.sha }}             --region us-central1             --platform managed
```

### Deployment Strategy

1. **Preview Deployments**: Every PR gets a preview URL
2. **Staging**: `develop` branch → staging environment
3. **Production**: `main` branch → production (with approval gate)
4. **Rollback**: Instant rollback via Cloud Run revisions

---

## 6. Critical Technical Patterns

### State Management Architecture

```typescript
// stores/useOwnerStore.ts - Global UI state
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface OwnerState {
  // UI state
  sidebarCollapsed: boolean;
  commandPaletteOpen: boolean;
  selectedDateRange: DateRange;

  // User preferences
  preferences: OwnerPreferences;

  // Actions
  toggleSidebar: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setDateRange: (range: DateRange) => void;
}

export const useOwnerStore = create<OwnerState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      commandPaletteOpen: false,
      selectedDateRange: getDefaultDateRange(),
      preferences: defaultPreferences,

      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
      setDateRange: (range) => set({ selectedDateRange: range }),
    }),
    { name: 'owner-store' }
  )
);

// hooks/useRevenue.ts - Server state via TanStack Query
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { z } from 'zod';

const RevenueDataSchema = z.object({
  todayRevenue: z.number(),
  weekRevenue: z.number(),
  monthRevenue: z.number(),
  topServices: z.array(z.object({
    name: z.string(),
    revenue: z.number(),
    bookings: z.number(),
  })),
});

type RevenueData = z.infer<typeof RevenueDataSchema>;

export function useRevenue(dateRange: DateRange) {
  return useQuery<RevenueData>({
    queryKey: ['revenue', dateRange],
    queryFn: async () => {
      const response = await api.get('/revenue/summary', {
        params: { start: dateRange.start, end: dateRange.end },
      });
      return RevenueDataSchema.parse(response.data); // Runtime validation!
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000,   // 30 minutes
  });
}
```

### Data Fetching Patterns

```typescript
// Pattern 1: Optimistic updates for instant UX
export function useUpdateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.updateAppointment,
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: ['appointments'] });
      const previous = queryClient.getQueryData(['appointments']);
      queryClient.setQueryData(['appointments'], (old) => 
        optimisticUpdate(old, newData)
      );
      return { previous };
    },
    onError: (_err, _newData, context) => {
      queryClient.setQueryData(['appointments'], context?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}

// Pattern 2: Infinite scroll for large datasets
export function useInfiniteAppointments() {
  return useInfiniteQuery({
    queryKey: ['appointments'],
    queryFn: ({ pageParam }) => api.getAppointments({ cursor: pageParam }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined,
  });
}

// Pattern 3: Real-time via WebSocket
export function useRealtimeSchedule() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const ws = new WebSocket(WS_URL);
    ws.onmessage = (event) => {
      const update = ScheduleUpdateSchema.parse(JSON.parse(event.data));
      queryClient.setQueryData(['schedule', update.date], (old) =>
        mergeScheduleUpdate(old, update)
      );
    };
    return () => ws.close();
  }, [queryClient]);
}
```

### Routing Architecture

```typescript
// app/(owner)/layout.tsx
export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <OwnerAuthProvider>
      <div className="min-h-screen bg-surface-primary">
        <CommandBar />
        <div className="flex">
          <OwnerSidebar />
          <main className="flex-1 p-6">
            <KpiPulseStrip />
            {children}
          </main>
        </div>
      </div>
    </OwnerAuthProvider>
  );
}

// app/(owner)/dashboard/page.tsx
export default async function OwnerDashboard() {
  // RSC: Data fetching on server
  const revenue = await getRevenueData();
  const schedule = await getTodaySchedule();
  const aiInsights = await getAIInsights();

  return (
    <DashboardGrid>
      <RevenueCommandCenter data={revenue} />
      <LiveSchedule data={schedule} />
      <AIInsightsPanel insights={aiInsights} />
    </DashboardGrid>
  );
}
```

### Error Handling Pattern

```typescript
// components/ErrorBoundary.tsx
'use client';

import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';
import { GlassCard } from '@/components/shared/GlassCard';
import { Button } from '@/components/ui/button';

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <GlassCard className="p-6 text-center">
      <h3 className="text-lg font-semibold text-text-primary">
        Something went wrong
      </h3>
      <p className="text-text-secondary mt-2">
        {error.message}
      </p>
      <Button onClick={resetErrorBoundary} className="mt-4">
        Try again
      </Button>
    </GlassCard>
  );
}

export function AppErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ReactErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, info) => {
        // Log to observability service
        logError(error, info);
      }}
    >
      {children}
    </ReactErrorBoundary>
  );
}
```

---

## Anti-Pattern Prevention Checklist

### What We're Preventing (from previous 6.2/10 score)

| Previous Issue | Prevention Strategy |
|----------------|---------------------|
| Hardcoded colors | Three-tier token system + ESLint rule + CI check |
| Inconsistent styling | shadcn/ui variants + design tokens only |
| Poor test coverage | 80% coverage threshold in CI |
| Excessive `any` types | TypeScript strict mode + no `any` ESLint rule |
| No runtime validation | Zod schemas for all API responses |
| Missing error handling | Error boundaries + TanStack Query error states |
| No loading states | Skeleton components required for all async data |
| Accessibility gaps | axe-core in CI + manual audit checklist |

### Code Quality Gates

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "exactOptionalPropertyTypes": true
  }
}

// .eslintrc.json
{
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unsafe-assignment": "error",
    "@typescript-eslint/no-unsafe-member-access": "error",
    "@typescript-eslint/no-unsafe-call": "error",
    "@typescript-eslint/strict-boolean-expressions": "error",
    "salonos/no-hardcoded-colors": "error",
    "salonos/no-raw-alert": "error"
  }
}
```

---

## Cross-Team Dependencies

| Dependency | Team | Coordination Required |
|------------|------|----------------------|
| API contracts | Backend | Define OpenAPI spec before frontend development |
| WebSocket events | Backend | Real-time event schema for schedule updates |
| Auth tokens | Backend | JWT structure, refresh token flow |
| CI/CD pipeline | DevOps | Cloud Run deployment configuration |
| Visual regression | Quality | Playwright test coordination |
| Performance budgets | Observability | Core Web Vitals monitoring setup |
| Security review | Security | CSP headers, XSS prevention audit |

---

## Success Metrics

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| UI Score | 6.2/10 | 9+/10 | Quarterly visual audit |
| Lighthouse Performance | ~60 | 90+ | CI pipeline |
| Lighthouse Accessibility | ~70 | 95+ | CI pipeline |
| TypeScript `any` count | 200+ | 0 | `grep -r "any" src/` |
| Test coverage | ~40% | 80%+ | Vitest coverage report |
| Hardcoded color violations | 50+ | 0 | `pnpm audit:tokens` |
| Core Web Vitals LCP | ~3.5s | <2.5s | Real User Monitoring |
| Core Web Vitals INP | ~300ms | <200ms | Real User Monitoring |

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Next.js 14 project setup with App Router
- [ ] TypeScript strict mode configuration
- [ ] TailwindCSS + design token integration
- [ ] shadcn/ui installation and customization
- [ ] ESLint + Prettier + custom rules
- [ ] CI/CD pipeline setup

### Phase 2: Core Surfaces (Week 3-4)
- [ ] Owner HQ layout and shell
- [ ] Staff Workspace layout and shell
- [ ] Client PWA layout and shell
- [ ] Authentication flow
- [ ] API client with Zod validation

### Phase 3: Feature Migration (Week 5-8)
- [ ] Revenue Command Center
- [ ] Live Schedule
- [ ] AI Insights Panel
- [ ] Booking flow
- [ ] Client PWA pages

### Phase 4: Polish & Launch (Week 9-10)
- [ ] Visual regression testing
- [ ] Performance optimization
- [ ] Accessibility audit
- [ ] Documentation
- [ ] Production deployment

---

*This ADR is the authoritative source for frontend architecture decisions. All team members must follow these patterns. Updates require Frontend Architect approval.*
