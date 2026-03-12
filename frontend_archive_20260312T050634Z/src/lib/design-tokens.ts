/**
 * SalonOS Design Token System - Three-Tier Architecture
 * 
 * Tier 1: Primitive (immutable raw values)
 * Tier 2: Semantic (purpose-driven, theme-aware)
 * Tier 3: Component (component-specific)
 * 
 * Uses OKLCH color space for perceptual uniformity
 * Based on "Operational Luxury" design doctrine
 */

// ============================================================================
// TIER 1: PRIMITIVE TOKENS (Immutable raw values)
// ============================================================================

export const primitive = {
  // OKLCH Colors - Owner HQ (Dark Mode)
  colors: {
    // Slate neutrals (dark mode base)
    slate: {
      50: 'oklch(0.984 0.003 247)',
      100: 'oklch(0.968 0.005 247)',
      200: 'oklch(0.929 0.009 247)',
      300: 'oklch(0.869 0.013 247)',
      400: 'oklch(0.709 0.016 247)',
      500: 'oklch(0.554 0.017 247)',
      600: 'oklch(0.446 0.017 247)',
      700: 'oklch(0.372 0.015 247)',
      800: 'oklch(0.279 0.013 247)',
      900: 'oklch(0.208 0.011 247)',
      950: 'oklch(0.129 0.009 247)',
    },
    // Emerald (primary accent - revenue/growth)
    emerald: {
      400: 'oklch(0.765 0.177 163)',
      500: 'oklch(0.723 0.219 149)',
      600: 'oklch(0.627 0.194 149)',
    },
    // Blue (secondary accent - intelligence/tech)
    blue: {
      400: 'oklch(0.707 0.165 254)',
      500: 'oklch(0.623 0.214 259)',
      600: 'oklch(0.546 0.245 262)',
    },
    // Amber (warning/attention)
    amber: {
      400: 'oklch(0.828 0.189 84)',
      500: 'oklch(0.769 0.188 70)',
    },
    // Rose (error/critical)
    rose: {
      400: 'oklch(0.712 0.194 13)',
      500: 'oklch(0.645 0.246 16)',
    },
  },
  // Spacing (4px base unit)
  spacing: {
    0: '0',
    1: '0.25rem',   // 4px
    2: '0.5rem',    // 8px
    3: '0.75rem',   // 12px
    4: '1rem',      // 16px
    5: '1.25rem',   // 20px
    6: '1.5rem',    // 24px
    8: '2rem',      // 32px
    10: '2.5rem',   // 40px
    12: '3rem',     // 48px
    16: '4rem',     // 64px
  },
  // Border radius
  radius: {
    none: '0',
    sm: '0.5rem',     // 8px
    md: '0.75rem',    // 12px
    lg: '1rem',       // 16px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.75rem', // 28px - premium glass
    full: '9999px',
  },
  // Typography scale
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],      // 12px
    sm: ['0.875rem', { lineHeight: '1.25rem' }],   // 14px
    base: ['1rem', { lineHeight: '1.5rem' }],      // 16px
    lg: ['1.125rem', { lineHeight: '1.75rem' }],   // 18px
    xl: ['1.25rem', { lineHeight: '1.75rem' }],    // 20px
    '2xl': ['1.5rem', { lineHeight: '2rem' }],     // 24px
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }],  // 36px
  },
  // Font weights
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
  // Shadows
  boxShadow: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    glass: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
  },
  // Transitions
  transition: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    normal: '250ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '350ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const;

// ============================================================================
// TIER 2: SEMANTIC TOKENS (Purpose-driven, theme-aware)
// ============================================================================

export const semantic = {
  // Background colors
  bg: {
    primary: 'bg-[oklch(0.129_0.009_247)]',      // slate-950
    secondary: 'bg-[oklch(0.208_0.011_247)]',     // slate-900
    tertiary: 'bg-[oklch(0.279_0.013_247)]',      // slate-800
    surface: 'bg-white/[0.04]',
    elevated: 'bg-white/[0.06]',
    hover: 'bg-white/[0.08]',
    active: 'bg-white/[0.10]',
  },
  // Text colors
  text: {
    primary: 'text-white',
    secondary: 'text-[oklch(0.869_0.013_247)]',   // slate-300
    tertiary: 'text-[oklch(0.709_0.016_247)]',    // slate-400
    muted: 'text-[oklch(0.554_0.017_247)]',       // slate-500
    inverse: 'text-[oklch(0.129_0.009_247)]',     // slate-950
  },
  // Border colors
  border: {
    default: 'border-white/[0.08]',
    subtle: 'border-white/[0.04]',
    strong: 'border-white/[0.12]',
    hover: 'border-white/[0.16]',
    focus: 'border-[oklch(0.723_0.219_149)]',     // emerald-500
  },
  // Accent colors
  accent: {
    primary: 'text-[oklch(0.723_0.219_149)]',     // emerald-500
    primaryBg: 'bg-[oklch(0.723_0.219_149)]',
    secondary: 'text-[oklch(0.623_0.214_259)]',   // blue-500
    secondaryBg: 'bg-[oklch(0.623_0.214_259)]',
    warning: 'text-[oklch(0.769_0.188_70)]',      // amber-500
    warningBg: 'bg-[oklch(0.769_0.188_70)]',
    error: 'text-[oklch(0.645_0.246_16)]',        // rose-500
    errorBg: 'bg-[oklch(0.645_0.246_16)]',
  },
  // Glassmorphism effects
  glass: {
    subtle: 'bg-white/[0.03] backdrop-blur-md border border-white/[0.06]',
    default: 'bg-white/[0.05] backdrop-blur-lg border border-white/[0.08]',
    strong: 'bg-white/[0.08] backdrop-blur-xl border border-white/[0.12]',
    panel: 'bg-gradient-to-b from-white/[0.06] to-white/[0.02] backdrop-blur-lg border border-white/[0.08]',
  },
  // Focus states
  focus: {
    ring: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.723_0.219_149)] focus-visible:ring-offset-2 focus-visible:ring-offset-[oklch(0.129_0.009_247)]',
  },
} as const;

// ============================================================================
// TIER 3: COMPONENT TOKENS (Component-specific)
// ============================================================================

export const component = {
  // Button tokens
  button: {
    height: {
      sm: 'h-8',
      md: 'h-10',
      lg: 'h-12',
    },
    padding: {
      sm: 'px-3 py-1.5',
      md: 'px-4 py-2',
      lg: 'px-6 py-3',
    },
    radius: 'rounded-xl',
    font: 'font-semibold text-sm',
    primary: 'bg-[oklch(0.723_0.219_149)] text-[oklch(0.129_0.009_247)] hover:bg-[oklch(0.765_0.177_163)] transition-colors',
    secondary: 'bg-white/[0.06] text-white border border-white/[0.08] hover:bg-white/[0.10] transition-colors',
    ghost: 'text-[oklch(0.709_0.016_247)] hover:text-white hover:bg-white/[0.06] transition-colors',
  },
  // Card tokens
  card: {
    radius: 'rounded-[1.75rem]',
    padding: 'p-6',
    base: 'bg-gradient-to-b from-white/[0.06] to-white/[0.02] border border-white/[0.08] backdrop-blur-lg',
    hover: 'hover:border-white/[0.12] hover:from-white/[0.08] hover:to-white/[0.04] transition-all duration-250',
  },
  // KPI Card tokens
  kpi: {
    radius: 'rounded-[1.75rem]',
    padding: 'p-5',
    base: 'bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/[0.08]',
    label: 'text-xs font-medium tracking-wider uppercase text-[oklch(0.554_0.017_247)]',
    value: 'text-2xl font-bold text-white tabular-nums',
    change: 'text-xs font-medium',
    positive: 'text-[oklch(0.723_0.219_149)]',
    negative: 'text-[oklch(0.645_0.246_16)]',
  },
  // Input tokens
  input: {
    height: 'h-10',
    padding: 'px-4 py-2',
    radius: 'rounded-xl',
    base: 'bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-[oklch(0.554_0.017_247)]',
    focus: 'focus:border-[oklch(0.723_0.219_149)] focus:ring-1 focus:ring-[oklch(0.723_0.219_149)]',
  },
  // Badge tokens
  badge: {
    radius: 'rounded-full',
    padding: 'px-2.5 py-0.5',
    font: 'text-xs font-medium',
    default: 'bg-white/[0.06] text-[oklch(0.869_0.013_247)]',
    success: 'bg-[oklch(0.723_0.219_149)]/10 text-[oklch(0.723_0.219_149)]',
    warning: 'bg-[oklch(0.769_0.188_70)]/10 text-[oklch(0.769_0.188_70)]',
    error: 'bg-[oklch(0.645_0.246_16)]/10 text-[oklch(0.645_0.246_16)]',
  },
  // Navigation tokens
  nav: {
    item: 'flex items-center gap-3 px-3 py-2 rounded-xl text-[oklch(0.709_0.016_247)] hover:text-white hover:bg-white/[0.06] transition-all',
    active: 'text-white bg-white/[0.08] border border-white/[0.12]',
    icon: 'w-5 h-5',
  },
  // Section tokens
  section: {
    gap: 'space-y-6',
    header: 'flex items-center justify-between mb-4',
    title: 'text-lg font-semibold text-white',
    subtitle: 'text-sm text-[oklch(0.554_0.017_247)]',
  },
  // Module boundary tokens
  module: {
    wrapper: 'rounded-[1.75rem] bg-gradient-to-b from-white/[0.06] to-white/[0.02] border border-white/[0.08] p-6',
    header: 'flex items-center justify-between mb-5',
    title: 'text-base font-semibold text-white',
    content: 'space-y-4',
  },
} as const;

// ============================================================================
// LEGACY COMPATIBILITY (Tailwind class mappings)
// ============================================================================

export const radius = {
  sm: 'rounded-lg',
  md: 'rounded-xl',
  lg: 'rounded-2xl',
  xl: 'rounded-[28px]',
  full: 'rounded-full',
} as const;

export const spacing = {
  xs: 'gap-1',
  sm: 'gap-2',
  md: 'gap-3',
  lg: 'gap-4',
  xl: 'gap-5',
  '2xl': 'gap-6',
  '3xl': 'gap-8',
} as const;

export const colors = {
  bg: {
    primary: 'bg-zinc-900/70',
    secondary: 'bg-zinc-800/70',
    surface: 'bg-white/5',
    elevated: 'bg-white/[0.08]',
  },
  border: {
    default: 'border-white/10',
    subtle: 'border-white/5',
    hover: 'border-white/20',
    focus: 'border-emerald-500/50',
  },
  text: {
    primary: 'text-white',
    secondary: 'text-zinc-400',
    muted: 'text-zinc-500',
    inverse: 'text-zinc-900',
  },
  accent: {
    primary: 'text-emerald-400',
    primaryBg: 'bg-emerald-500',
    secondary: 'text-blue-400',
    secondaryBg: 'bg-blue-500',
  },
} as const;

// ============================================================================
// GLASSMORPHISM PRESETS
// ============================================================================

export const glass = {
  subtle: 'bg-white/[0.03] backdrop-blur-md border border-white/[0.06]',
  default: 'bg-white/[0.05] backdrop-blur-lg border border-white/[0.08]',
  strong: 'bg-white/[0.08] backdrop-blur-xl border border-white/[0.12]',
  panel: 'bg-gradient-to-b from-white/[0.06] to-white/[0.02] backdrop-blur-lg border border-white/[0.08]',
  prominent: 'bg-white/[0.10] backdrop-blur-xl border border-white/[0.15]',
  gradient: 'bg-gradient-to-br from-white/[0.08] via-white/[0.04] to-white/[0.02] backdrop-blur-lg border border-white/[0.10]',
} as const;

// ============================================================================
// FOCUS STATES
// ============================================================================

export const focus = {
  ring: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900',
  within: 'focus-within:ring-2 focus-within:ring-emerald-500/50 focus-within:ring-offset-2 focus-within:ring-offset-zinc-900',
  default: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900',
} as const;

// ============================================================================
// COMPOSITE HELPERS
// ============================================================================

/**
 * Compose glass effect classes
 */
export function glassEffect(level: 'subtle' | 'default' | 'strong' | 'panel' = 'default'): string {
  return glass[level];
}

/**
 * Compose focus ring classes
 */
export function focusRing(): string {
  return focus.ring;
}

/**
 * Get component token classes
 */
export function componentClasses(componentName: keyof typeof component, variant?: string): string {
  const comp = component[componentName];
  if (!variant) return '';
  return (comp as any)[variant] || '';
}

// Export all tokens as default
export default {
  primitive,
  semantic,
  component,
  radius,
  spacing,
  colors,
  glass,
  focus,
  glassEffect,
  focusRing,
  componentClasses,
};


/* ========================================================================
 * BACKWARD-COMPATIBLE EXPORTS (for existing components)
 * ======================================================================== */

export const transition = {
  fast: 'transition-all duration-150 ease-out',
  normal: 'transition-all duration-250 ease-out',
  slow: 'transition-all duration-350 ease-out',
  default: 'transition-all duration-200 ease-out',
  colors: 'transition-colors duration-200 ease-out',
  transform: 'transition-transform duration-200 ease-out',
  opacity: 'transition-opacity duration-200 ease-out',
} as const;

export const shadow = {
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
  glass: 'shadow-glass',
  glow: 'shadow-[0_0_20px_rgba(16,185,129,0.15)]',
} as const;

export const typography = {
  h1: 'text-4xl font-bold tracking-tight',
  h2: 'text-3xl font-semibold tracking-tight',
  h3: 'text-2xl font-semibold',
  h4: 'text-xl font-medium',
  h5: 'text-lg font-medium',
  body: 'text-base',
  bodySmall: 'text-sm',
  caption: 'text-xs',
  label: 'text-xs font-medium uppercase tracking-wider',
  mono: 'font-mono text-sm',
  size: {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl',
    '4xl': 'text-4xl',
  },
  weight: {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
  },
  tracking: {
    tight: 'tracking-tight',
    normal: 'tracking-normal',
    wide: 'tracking-wide',
    wider: 'tracking-wider',
  },
} as const;

export const roleAccents = {
  owner: {
    primary: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    glow: 'shadow-[0_0_20px_rgba(16,185,129,0.15)]',
  },
  staff: {
    primary: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    glow: 'shadow-[0_0_20px_rgba(59,130,246,0.15)]',
  },
  client: {
    primary: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    glow: 'shadow-[0_0_20px_rgba(245,158,11,0.15)]',
  },
} as const;

export const padding = {
  none: 'p-0',
  xs: 'p-1',
  sm: 'p-2',
  md: 'p-4',
  lg: 'p-6',
  xl: 'p-8',
  card: 'p-6',
  section: 'p-8',
} as const;

