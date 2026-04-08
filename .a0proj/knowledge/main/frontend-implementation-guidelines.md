# SalonOS Frontend Implementation Guidelines
## Technical Standards for All Frontend Development

---

## 1. Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | React | 18.x |
| Language | TypeScript | 5.x |
| Build | Vite | 5.x |
| Styling | TailwindCSS | 3.x |
| Animation | Framer Motion | 11.x |
| Icons | Lucide React | latest |
| State | TanStack Query | 5.x |
| Routing | React Router | 6.x |

---

## 2. File Organization

```
frontend/src/
├── components/
│   ├── ui/           # Shared primitives (Button, Card, KpiCard, GlassCard)
│   ├── layout/       # Shell components (OwnerLayout, Sidebar, TopBar)
│   ├── owner/        # Owner-specific components
│   └── system/       # ErrorBoundary, etc.
├── pages/
│   ├── owner/        # Owner route pages
│   ├── staff/        # Staff route pages
│   └── client/       # Client route pages
├── features/
│   └── dashboard/    # Feature-specific hooks and logic
├── lib/
│   ├── design-tokens.ts  # MANDATORY: All design values
│   └── utils.ts          # Utility functions
└── services/         # API clients
```

---

## 3. Component Standards

### 3.1 MANDATORY: Use Design Tokens

```typescript
// ✅ CORRECT - Import and use tokens
import { radius, colors, glass, spacing, typography } from '@/lib/design-tokens'

function MyCard() {
  return (
    <div className={`${radius.xl} ${colors.bg.primary} ${glass.default} ${spacing.lg}`}>
      <h2 className={`${typography.size.lg} ${typography.weight.semibold} ${colors.text.primary}`}>
        Title
      </h2>
    </div>
  )
}

// ❌ WRONG - Hardcoded values
function MyCard() {
  return (
    <div className="rounded-xl bg-zinc-900/70 backdrop-blur-lg border border-white/10 p-4">
      <h2 className="text-base font-semibold text-white">Title</h2>
    </div>
  )
}
```

### 3.2 Component Hierarchy

| Component | Location | When to Use |
|-----------|----------|-------------|
| `KpiCard` | `@/components/ui/KpiCard` | ALL metric displays |
| `GlassCard` | `@/components/ui/GlassCard` | ALL glass surfaces |
| `Button` | `@/components/ui/button` | ALL buttons |
| `Badge` | `@/components/ui/badge` | ALL status indicators |
| `Skeleton` | `@/components/ui/Skeleton` | ALL loading states |

### 3.3 NEVER Create Inline Components

```typescript
// ❌ WRONG - Inline KPI component
function KpiPulse({ label, value }) {
  return <div className="rounded-xl border...">...</div>
}

// ✅ CORRECT - Use shared component
import { KpiCard } from '@/components/ui/KpiCard'
<KpiCard label={label} value={value} />
```

---

## 4. Layout Rules

### 4.1 Page Structure
```typescript
// Every owner page MUST follow this structure
import { OwnerPageScaffold } from '@/components/owner/OwnerPageScaffold'
import { OwnerModuleBoundary } from '@/components/owner/OwnerModuleBoundary'

export default function MyPage() {
  return (
    <OwnerPageScaffold title="Page Title" subtitle="Description">
      <OwnerModuleBoundary title="Section">
        {/* Content */}
      </OwnerModuleBoundary>
    </OwnerPageScaffold>
  )
}
```

### 4.2 Responsive Grid
```typescript
// Use responsive grids, NOT single-column
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Cards */}
</div>
```

---

## 5. Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Components | PascalCase | `OwnerDashboard.tsx` |
| Hooks | camelCase with `use` | `useOwnerDashboard.ts` |
| Utilities | camelCase | `formatCurrency.ts` |
| Constants | UPPER_SNAKE | `API_BASE_URL` |
| CSS Classes | Tailwind utilities | Use tokens, not raw values |

---

## 6. Anti-Patterns (CI Will Block)

### Forbidden Patterns
```bash
# These patterns should NOT appear in page components:
grep -r "rounded-xl\|bg-zinc-900/70\|backdrop-blur" src/pages --include="*.tsx"

# Inline KPI components:
grep -r "function Kpi" src/pages --include="*.tsx"

# Hardcoded colors:
grep -r "text-emerald-400\|text-amber-400" src/pages --include="*.tsx" | grep -v "design-tokens"
```

---

## 7. Testing Requirements

### Pre-Deploy Checklist
- [ ] `npm run build` passes with 0 errors
- [ ] No TypeScript errors
- [ ] All components use design tokens
- [ ] No inline KPI/Card components
- [ ] Responsive on mobile (375px) and desktop (1440px)

---

## 8. Deployment

```bash
# Build and deploy to Cloud Run
npm run build
gcloud builds submit --config=cloudbuild.frontend.yaml
```

---

*These guidelines are enforced. Non-compliant code will be rejected.*
