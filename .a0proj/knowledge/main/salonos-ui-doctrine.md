# SalonOS UI Doctrine
## Version 1.0 | Source of Truth for All UI/UX Decisions

---

## 1. Design Philosophy

**"Operational Luxury"** — SalonOS balances high-density business utility with premium hospitality aesthetics.

- **Owner surfaces**: Dark, data-rich, fintech-grade command centers
- **Staff surfaces**: Touch-efficient, glanceable execution tools
- **Client surfaces**: Warm, aspirational, concierge-quality experiences

### Core Principles
1. **Time-to-Decision**: Every screen must deliver actionable insight within 5 seconds
2. **Density with Clarity**: More data ≠ more clutter. Use hierarchy, not whitespace
3. **Premium ≠ Pretty**: Professional trust comes from precision, not decoration
4. **AI-Native**: AI insights are first-class citizens, not afterthoughts

---

## 2. Visual Identity

### Color System
| Token | Value | Usage |
|-------|-------|-------|
| `bg.primary` | `bg-zinc-900/70` | Main surfaces |
| `bg.secondary` | `bg-zinc-800/70` | Nested panels |
| `bg.surface` | `bg-white/5` | Inputs, subtle elements |
| `bg.elevated` | `bg-white/[0.08]` | Hover states |
| `border.default` | `border-white/10` | Standard borders |
| `border.subtle` | `border-white/5` | Nested borders |
| `text.primary` | `text-white` | Headlines, values |
| `text.secondary` | `text-zinc-400` | Labels, descriptions |
| `text.muted` | `text-zinc-500` | Hints, metadata |

### Accent Colors (Role-Based)
| Role | Primary | Usage |
|------|---------|-------|
| Owner | Amber (`amber-500`) | Revenue, authority |
| Manager | Violet (`violet-500`) | Oversight, delegation |
| Staff | Emerald (`emerald-500`) | Tasks, completion |
| Client | Sky (`sky-500`) | Bookings, personal |

### Glassmorphism Standards
```typescript
// ALWAYS use these tokens from design-tokens.ts
glass.default   // bg-zinc-900/70 backdrop-blur-lg border border-white/10
glass.prominent // Enhanced blur for hero surfaces
glass.subtle    // Nested elements
glass.gradient  // KPI cards premium overlay
```

---

## 3. Typography

### Scale (from design-tokens.ts)
| Token | Tailwind | Usage |
|-------|----------|-------|
| `size.xs` | `text-[10px]` | Micro labels |
| `size.sm` | `text-xs` | Captions, badges |
| `size.base` | `text-sm` | Body text |
| `size.lg` | `text-base` | Section headers |
| `size.xl` | `text-lg` | Page titles |
| `size.2xl` | `text-xl` | Hero values |
| `size.3xl` | `text-2xl` | KPI numbers |
| `size.4xl` | `text-3xl` | Dashboard hero |

### Weight Rules
- **Numbers/Values**: `font-bold` or `font-semibold`
- **Labels**: `font-medium` + `uppercase tracking-wider`
- **Body**: `font-normal`

---

## 4. Spacing & Layout

### 4px Base Unit System
| Token | Value | Usage |
|-------|-------|-------|
| `xs` | 4px | Tight inline |
| `sm` | 8px | Related elements |
| `md` | 12px | Standard gap |
| `lg` | 16px | Section padding |
| `xl` | 20px | Card padding |
| `2xl` | 24px | Section gaps |
| `3xl` | 32px | Major sections |

### Border Radius
| Token | Value | Usage |
|-------|-------|-------|
| `sm` | 8px | Badges, small elements |
| `md` | 12px | Buttons, inputs |
| `lg` | 16px | Cards |
| `xl` | 28px | Premium glass surfaces |
| `full` | 9999px | Pills, avatars |

---

## 5. Component Standards

### MANDATORY: Use design-tokens.ts
```typescript
// ✅ CORRECT
import { radius, colors, glass, spacing } from '@/lib/design-tokens'
<div className={`${radius.xl} ${colors.bg.primary} ${glass.default}`}>

// ❌ WRONG - Hardcoded values
<div className="rounded-xl bg-zinc-900/70 backdrop-blur-lg border border-white/10">
```

### KPI Cards
- MUST use `KpiCard` component from `@/components/ui/KpiCard`
- NEVER create inline KPI components
- Use gradient overlay: `glass.gradient`

### Glass Cards
- MUST use `GlassCard` component from `@/components/ui/GlassCard`
- Standard: `glassCardBase` token
- Premium: `glassCardPremium` token

### Buttons
- MUST use `Button` component from `@/components/ui/button`
- Use `buttonBase` token for custom buttons

---

## 6. Anti-Patterns (FORBIDDEN)

| Anti-Pattern | Why It's Wrong | Fix |
|--------------|----------------|-----|
| Inline KPI components | Duplicates `KpiCard`, breaks consistency | Import from `@/components/ui/KpiCard` |
| Hardcoded color strings | Breaks theme, maintenance nightmare | Use `colors.*` tokens |
| Custom glass effects | Inconsistent blur/border | Use `glass.*` tokens |
| Raw `rounded-xl` | Wrong radius for context | Use `radius.*` tokens |
| Explanatory paragraphs | Clutters operational UI | Use tooltips or collapsible |
| Marketing language | "Powerful", "Seamless" | Use precise, clinical copy |
| Single-column layouts | Wastes horizontal space | Use responsive grids |

---

## 7. Enforcement

### Pre-Commit Checklist
- [ ] All components import from `design-tokens.ts`
- [ ] No hardcoded color values in JSX
- [ ] Glass effects use `glass.*` tokens
- [ ] KPI displays use `KpiCard` component
- [ ] Buttons use `Button` component
- [ ] Radius uses `radius.*` tokens

### Audit Command
```bash
grep -r "rounded-xl\|bg-zinc-900/70\|backdrop-blur" frontend/src/pages --include="*.tsx" | grep -v "design-tokens"
```

---

*This doctrine is the source of truth. All UI work must comply.*
