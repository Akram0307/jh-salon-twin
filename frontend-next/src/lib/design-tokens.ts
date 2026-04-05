/**
 * SalonOS Three-Tier Design Token System
 * OKLCH color space for perceptual uniformity
 * Tier 1: Primitive (raw values)
 * Tier 2: Semantic (meaning-based)
 * Tier 3: Component (usage-based)
 */

// ═══════════════════════════════════════════════════════════════
// TIER 1: PRIMITIVE TOKENS
// ═══════════════════════════════════════════════════════════════

export const primitive = {
  // OKLCH Surface Scale (Owner HQ - Dark Mode)
  surface: {
    0: 'oklch(0.08 0.005 264)',   // Deepest background
    1: 'oklch(0.12 0.008 264)',   // Card background
    2: 'oklch(0.16 0.010 264)',   // Elevated surface
    3: 'oklch(0.20 0.012 264)',   // Hover/active state
    4: 'oklch(0.24 0.014 264)',   // Highest elevation
  },
  // Accent Colors
  accent: {
    primary: 'oklch(0.65 0.22 264)',   // Electric violet
    secondary: 'oklch(0.70 0.15 320)', // Rose
    success: 'oklch(0.70 0.18 145)',   // Emerald
    warning: 'oklch(0.75 0.16 75)',    // Amber
    danger: 'oklch(0.60 0.22 25)',     // Red
    info: 'oklch(0.70 0.14 240)',      // Sky
  },
  // Text Hierarchy
  text: {
    primary: 'oklch(0.95 0.005 264)',
    secondary: 'oklch(0.70 0.008 264)',
    muted: 'oklch(0.50 0.005 264)',
    inverse: 'oklch(0.15 0.005 264)',
  },
  // Border
  border: {
    subtle: 'oklch(0.25 0.010 264)',
    default: 'oklch(0.30 0.012 264)',
    strong: 'oklch(0.40 0.015 264)',
  },
} as const;

// ═══════════════════════════════════════════════════════════════
// TIER 2: SEMANTIC TOKENS
// ═══════════════════════════════════════════════════════════════

export const semantic = {
  // Background layers
  bg: {
    app: primitive.surface[0],
    card: primitive.surface[1],
    elevated: primitive.surface[2],
    overlay: primitive.surface[3],
  },
  // Interactive states
  interactive: {
    default: primitive.accent.primary,
    hover: 'oklch(0.70 0.22 264)',
    active: 'oklch(0.60 0.22 264)',
    disabled: 'oklch(0.30 0.010 264)',
  },
  // Status colors
  status: {
    online: primitive.accent.success,
    busy: primitive.accent.warning,
    offline: primitive.text.muted,
    error: primitive.accent.danger,
  },
  // Revenue indicators
  revenue: {
    up: primitive.accent.success,
    down: primitive.accent.danger,
    neutral: primitive.text.secondary,
  },
} as const;

// ═══════════════════════════════════════════════════════════════
// TIER 3: COMPONENT TOKENS
// ═══════════════════════════════════════════════════════════════

export const component = {
  // Glass morphism effects
  glass: {
    card: {
      background: 'rgba(18, 18, 24, 0.7)',
      backdropFilter: 'blur(20px) saturate(180%)',
      border: '1px solid rgba(255, 255, 255, 0.06)',
    },
    elevated: {
      background: 'rgba(24, 24, 32, 0.85)',
      backdropFilter: 'blur(30px) saturate(200%)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
    },
    sidebar: {
      background: 'rgba(12, 12, 18, 0.95)',
      backdropFilter: 'blur(40px)',
      border: '1px solid rgba(255, 255, 255, 0.04)',
    },
  },
  // KPI Card specific
  kpi: {
    background: primitive.surface[1],
    border: primitive.border.subtle,
    valueColor: primitive.text.primary,
    labelColor: primitive.text.secondary,
    trendUp: primitive.accent.success,
    trendDown: primitive.accent.danger,
  },
  // Navigation
  nav: {
    background: primitive.surface[0],
    itemHover: primitive.surface[2],
    itemActive: primitive.surface[3],
    itemActiveBorder: primitive.accent.primary,
  },
  // Command bar
  commandBar: {
    background: primitive.surface[1],
    border: primitive.border.default,
    inputBg: primitive.surface[2],
  },
} as const;

// ═══════════════════════════════════════════════════════════════
// SPACING & LAYOUT TOKENS
// ═══════════════════════════════════════════════════════════════

export const spacing = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '3rem',   // 48px
  '3xl': '4rem',   // 64px
} as const;

export const radius = {
  sm: '0.375rem',  // 6px
  md: '0.5rem',    // 8px
  lg: '0.75rem',   // 12px
  xl: '1rem',      // 16px
  '2xl': '1.5rem', // 24px
  full: '9999px',
} as const;

export const typography = {
  fontFamily: {
    sans: 'Inter, system-ui, -apple-system, sans-serif',
    mono: 'JetBrains Mono, ui-monospace, monospace',
  },
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],
    sm: ['0.875rem', { lineHeight: '1.25rem' }],
    base: ['1rem', { lineHeight: '1.5rem' }],
    lg: ['1.125rem', { lineHeight: '1.75rem' }],
    xl: ['1.25rem', { lineHeight: '1.75rem' }],
    '2xl': ['1.5rem', { lineHeight: '2rem' }],
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
} as const;

// ═══════════════════════════════════════════════════════════════
// ANIMATION TOKENS
// ═══════════════════════════════════════════════════════════════

export const animation = {
  duration: {
    instant: '50ms',
    fast: '150ms',
    normal: '250ms',
    slow: '400ms',
  },
  easing: {
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
} as const;

// ═══════════════════════════════════════════════════════════════
// EXPORT ALL TOKENS
// ═══════════════════════════════════════════════════════════════

export const tokens = {
  primitive,
  semantic,
  component,
  spacing,
  radius,
  typography,
  animation,
} as const;

export type Tokens = typeof tokens;
