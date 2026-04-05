# SalonOS Design Principles & Guidelines

**Version:** 1.0  
**Last Updated:** 2026-03-12  
**Status:** Active - Source of Truth for all UI/UX decisions

---

## 1. Design Philosophy

### Core Identity: "Operational Luxury"

SalonOS balances **high-density data management** with **human-centric warmth**. The platform must feel like a decisive, invisible COO — not a generic dashboard or a toy application.

### Three Mental Models

| Surface | Mental Model | Key Principle |
|---------|--------------|---------------|
| **Owner HQ** | Revenue Command Center | Dark-mode fintech cockpit. Data-dense, decision-first. |
| **Staff Workspace** | Execution Surface | Touch-optimized, minimal friction. Focus on today's clients. |
| **Client PWA** | Premium Concierge | Luxury beauty-lifestyle experience. Aspirational, warm. |

### Design Archetypes

- **Owner HQ:** Stripe Dashboard, Linear, Arc Browser, Robinhood
- **Staff Workspace:** Notion Mobile, Things 3, Apple Health
- **Client PWA:** Glossier, Aesop, luxury fashion apps

---

## 2. Visual Identity

### Color System (OKLCH)

#### Owner HQ (Dark Mode Primary)
```css
/* Base */
--slate-950: oklch(0.13 0.01 264);  /* Deepest background */
--slate-900: oklch(0.18 0.015 264); /* Card background */
--slate-800: oklch(0.25 0.02 264);  /* Elevated surfaces */

/* Accent */
--gold-400: oklch(0.80 0.15 85);    /* Primary accent (luxury gold) */
--gold-500: oklch(0.75 0.16 85);    /* Hover states */
--emerald-400: oklch(0.75 0.15 155); /* Success/revenue positive */
--rose-400: oklch(0.70 0.18 15);     /* Alerts/negative */

/* Text */
--text-primary: oklch(0.95 0.005 264);   /* High contrast white */
--text-secondary: oklch(0.65 0.01 264);  /* Muted labels */
--text-tertiary: oklch(0.50 0.01 264);   /* Subtle hints */
```

#### Client PWA (Warm Light Mode)
```css
/* Base */
--ivory-50: oklch(0.98 0.005 85);   /* Primary background */
--sand-100: oklch(0.95 0.01 75);    /* Card background */
--cream-50: oklch(0.97 0.008 90);   /* Warm accent bg */

/* Accent */
--champagne-500: oklch(0.78 0.10 75); /* Primary brand */
--rose-gold-400: oklch(0.72 0.12 25); /* Secondary accent */
--sage-400: oklch(0.75 0.08 145);     /* Natural/organic */

/* Text */
--charcoal-900: oklch(0.20 0.01 264); /* Primary text */
--charcoal-600: oklch(0.45 0.01 264); /* Secondary text */
```

### Typography

#### Owner HQ
- **Headings:** Inter or DM Sans (geometric, professional)
- **Data/Numbers:** JetBrains Mono or Geist Mono (monospace for precision)
- **Body:** Inter (clean, readable at small sizes)

#### Client PWA
- **Headings:** Playfair Display or Cormorant (elegant serif)
- **Body:** Outfit or Instrument Sans (warm, modern sans)
- **Accents:** Smooch Sans (playful, beauty-industry feel)

### Spacing Scale

```
4px  → --space-1  (tight, inline elements)
8px  → --space-2  (compact groups)
12px → --space-3  (related items)
16px → --space-4  (default spacing)
24px → --space-6  (section gaps)
32px → --space-8  (major sections)
48px → --space-12 (page-level spacing)
64px → --space-16 (hero/landing spacing)
```

---

## 3. Component Architecture

### Three-Tier Design Token System

Based on USWDS, IBM Carbon, and Shopify Polaris patterns:

```typescript
// Tier 1: Primitive Tokens (immutable foundation)
const primitives = {
  gray: { 50: '#fafafa', 900: '#18181b' },
  gold: { 400: '#fbbf24', 500: '#f59e0b' },
  spacing: { 1: '4px', 2: '8px', 4: '16px' },
};

// Tier 2: Semantic Tokens (theme-aware)
const semantic = {
  'background-primary': 'var(--slate-950)',
  'text-primary': 'var(--text-primary)',
  'accent-primary': 'var(--gold-400)',
};

// Tier 3: Component Tokens (specific to UI elements)
const component = {
  'button-height': '2.5rem',
  'card-padding': '1.5rem',
  'kpi-card-radius': '0.75rem',
};
```

### Component Standards

#### KPI Cards (Owner HQ)
- **Layout:** Bento-style grid, 2-4 columns responsive
- **Content:** Large number + label + trend indicator
- **Animation:** Subtle pulse on data refresh
- **Touch target:** Minimum 44px height

#### Navigation
- **Owner HQ:** Fixed global command bar + grouped sidebar lanes
- **Staff:** Bottom tab bar (mobile-first)
- **Client PWA:** Floating action button + slide-out menu

#### Data Tables
- **Density:** Compact mode for owner, comfortable for client
- **Sorting:** Clickable headers with visual indicators
- **Pagination:** Infinite scroll for mobile, pagination for desktop

---

## 4. Layout Rules

### Owner HQ Dashboard Composition

```
┌─────────────────────────────────────────────────────────┐
│ [Global Command Bar]                    [User] [Alerts] │
├─────────────────────────────────────────────────────────┤
│ [KPI Pulse Strip] Revenue | Bookings | Clients | Staff  │
├─────────────────────────────────────────────────────────┤
│ [Critical Action Row] Waitlist | Alerts | Quick Actions │
├────────────────────────┬────────────────────────────────┤
│ [Operations Workspace] │ [AI Intelligence Rail]         │
│ - Today's Schedule     │ - Revenue Insights             │
│ - Recent Bookings      │ - Client Predictions           │
│ - Staff Status         │ - Optimization Tips            │
├────────────────────────┴────────────────────────────────┤
│ [Trends & Analytics] Charts, Graphs, Historical Data    │
└─────────────────────────────────────────────────────────┘
```

### Responsive Breakpoints

- **Mobile:** 0-639px (single column, stacked)
- **Tablet:** 640-1023px (2-column grid)
- **Desktop:** 1024-1279px (3-column layout)
- **Large:** 1280px+ (4-column, full dashboard)

### Z-Pattern Layout (Owner HQ)

Users scan in a Z-pattern. Place critical elements accordingly:
1. **Top-left:** Logo/brand, primary navigation
2. **Top-right:** User menu, notifications
3. **Center:** KPI strip (horizontal scan)
4. **Bottom-left:** Primary workspace
5. **Bottom-right:** Secondary insights

---

## 5. AI-Native Interaction Rules

### AI Concierge (Client PWA)
- **Entry:** Prominent "Ask SalonOS" button or chat bubble
- **Conversation:** WhatsApp-inspired, message bubbles with rich cards
- **Service Cards:** Embedded inline, tappable, with pricing
- **Time Slots:** Horizontal scrollable chips
- **Confirmation:** Clear summary card before booking

### AI Insights (Owner HQ)
- **Placement:** Dedicated intelligence rail (right sidebar)
- **Format:** Insight cards with confidence scores
- **Actions:** One-click apply suggestions
- **Tone:** Professional, data-backed, non-intrusive

### AI Revenue Brain
- **Dashboard Widget:** Revenue opportunity score
- **Alerts:** Proactive notifications for high-value actions
- **Visualizations:** Trend lines with AI-predicted trajectories

---

## 6. Accessibility Standards

### WCAG 2.1 AA Compliance (Minimum)

- **Text contrast:** 4.5:1 minimum (normal text)
- **Large text:** 3:1 minimum (18pt+ or 14pt bold+)
- **UI components:** 3:1 minimum (borders, icons)
- **Focus indicators:** Visible, high-contrast outlines

### Implementation Checklist

- [ ] All interactive elements keyboard accessible
- [ ] ARIA labels on all icons and image buttons
- [ ] Skip navigation link for keyboard users
- [ ] Form inputs have associated labels
- [ ] Error messages announced to screen readers
- [ ] Color not sole indicator of state (use icons + text)
- [ ] Reduced motion respected (`prefers-reduced-motion`)

---

## 7. Performance Standards

### Core Web Vitals Targets

- **LCP (Largest Contentful Paint):** < 2.5 seconds
- **INP (Interaction to Next Paint):** < 200ms
- **CLS (Cumulative Layout Shift):** < 0.1

### Implementation Strategies

- **Code splitting:** Lazy load heavy components (charts, tables)
- **Image optimization:** WebP/AVIF, responsive srcset
- **Virtualization:** @tanstack/react-virtual for long lists
- **Bundle size:** Target < 300KB gzipped for initial load

---

## 8. Anti-Patterns (Forbidden)

### Visual Anti-Patterns

❌ **Generic gray backgrounds** — Use slate-950 with subtle gradients  
❌ **Default browser focus rings** — Custom high-contrast focus indicators  
❌ **Centered text blocks** — Left-align for readability  
❌ **Excessive borders** — Use spacing and shadows for separation  
❌ **Rainbow color palettes** — Restrict to gold/emerald/rose accents  

### UX Anti-Patterns

❌ **Feature-list dashboards** — Prioritize data density and decisions  
❌ **Marketing copy in UI** — Remove explanatory text, show data  
❌ **Nested navigation** — Max 2 levels deep  
❌ **Modal overload** — Use slide-out drawers for secondary content  
❌ **Generic loading spinners** — Skeleton screens with content shape  

### Code Anti-Patterns

❌ **Hardcoded colors** — Always use design tokens  
❌ **Dynamic Tailwind classes** — Use conditional logic or safelist  
❌ **Inline styles** — Use Tailwind utilities or CSS variables  
❌ **Missing ARIA** — All interactive elements need labels  
❌ **No loading/error states** — Every data fetch needs both  

---

## 9. Implementation Checklist

### Setup Phase

- [ ] Configure TailwindCSS with three-tier token system
- [ ] Set up OKLCH color palette in CSS variables
- [ ] Install and configure shadcn/ui components
- [ ] Create `cn()` helper for className merging
- [ ] Set up dark mode with class strategy

### Development Phase

- [ ] Apply mobile-first responsive design
- [ ] Implement dark mode for Owner HQ
- [ ] Test all components for WCAG AA contrast
- [ ] Verify keyboard navigation flow
- [ ] Add loading and error states to all data components

### Production Phase

- [ ] Validate Tailwind purging (no unused styles)
- [ ] Test all interactive states (hover, focus, active, disabled)
- [ ] Cross-browser testing (Chrome, Safari, Firefox)
- [ ] Performance audit (Lighthouse score > 90)
- [ ] Accessibility audit (axe-core, no violations)

---

## 10. Reference Resources

### Internal Documentation
- `/a0/usr/projects/jh_salon_twin/.a0proj/knowledge/main/SALONOS_EXPERIENCE_DOCTRINE.md`
- `/a0/usr/projects/jh_salon_twin/.a0proj/knowledge/main/FRONTEND_IMPLEMENTATION_GUIDELINES.md`

### External Standards
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [Radix UI Primitives](https://www.radix-ui.com/primitives)
- [shadcn/ui Components](https://ui.shadcn.com)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [OKLCH Color Space](https://evilmartians.com/chronicles/oklch-in-css-why-quit-rgb-hsl)

### Design Inspiration
- [Stripe Dashboard](https://dashboard.stripe.com)
- [Linear App](https://linear.app)
- [Dribbble: Dark SaaS Dashboards](https://dribbble.com/search/dark-saas-dashboard)
- [Dribbble: Fintech Dashboards](https://dribbble.com/search/fintech-dashboard)

---

*This document is the source of truth for all SalonOS UI/UX decisions. All frontend development must comply with these principles.*
