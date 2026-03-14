/**
 * Client PWA Design Tokens
 * 
 * Editorial Luxury theme for the Client Conversational PWA.
 * Warm ivory backgrounds, champagne accents, glass morphism effects.
 */

// OKLCH Color Tokens for Client PWA
export const clientColors = {
  // Base Colors
  ivory: {
    50: 'oklch(0.98 0.005 85)',   // Primary background
    100: 'oklch(0.97 0.008 90)',  // Warm accent background
    200: 'oklch(0.95 0.01 75)',   // Card background
  },
  
  // Accent Colors
  champagne: {
    300: 'oklch(0.85 0.08 75)',   // Light hover
    400: 'oklch(0.82 0.09 75)',   // Medium hover
    500: 'oklch(0.78 0.10 75)',   // Primary brand color
    600: 'oklch(0.72 0.11 75)',   // Active state
  },
  
  roseGold: {
    300: 'oklch(0.78 0.10 25)',   // Light hover
    400: 'oklch(0.72 0.12 25)',   // Primary user message
    500: 'oklch(0.68 0.13 25)',   // Active state
  },
  
  sage: {
    300: 'oklch(0.82 0.06 145)',  // Light hover
    400: 'oklch(0.75 0.08 145)',  // Natural accent
    500: 'oklch(0.68 0.10 145)',  // Active state
  },
  
  // Text Colors
  charcoal: {
    900: 'oklch(0.20 0.01 264)',  // Primary text
    700: 'oklch(0.35 0.01 264)',  // Secondary text
    600: 'oklch(0.45 0.01 264)',  // Muted text
    400: 'oklch(0.60 0.01 264)',  // Hint text
  },
  
  // Semantic Colors
  success: {
    400: 'oklch(0.75 0.18 145)',  // Success green
    500: 'oklch(0.70 0.18 145)',  // Success dark
  },
  
  warning: {
    400: 'oklch(0.80 0.15 85)',   // Warning amber
    500: 'oklch(0.75 0.16 85)',   // Warning dark
  },
  
  error: {
    400: 'oklch(0.70 0.18 15)',   // Error rose
    500: 'oklch(0.65 0.20 15)',   // Error dark
  },
} as const;

// Glass Morphism Tokens
export const clientGlass = {
  // Default glass effect
  default: {
    background: 'oklch(0.98 0.005 85 / 0.7)',
    backdropFilter: 'blur(16px)',
    border: '1px solid oklch(0.90 0.01 85 / 0.5)',
  },
  
  // Prominent glass for cards
  prominent: {
    background: 'oklch(0.97 0.008 90 / 0.8)',
    backdropFilter: 'blur(24px)',
    border: '1px solid oklch(0.88 0.01 85 / 0.6)',
  },
  
  // Subtle glass for nested elements
  subtle: {
    background: 'oklch(0.99 0.003 85 / 0.5)',
    backdropFilter: 'blur(8px)',
    border: '1px solid oklch(0.92 0.01 85 / 0.3)',
  },
  
  // Chat bubble glass
  chatBubble: {
    ai: {
      background: 'oklch(0.96 0.02 75 / 0.6)',  // Champagne tint
      backdropFilter: 'blur(12px)',
      border: '1px solid oklch(0.90 0.02 75 / 0.4)',
    },
    user: {
      background: 'oklch(0.72 0.12 25 / 0.9)',  // Rose-gold
      backdropFilter: 'blur(12px)',
      border: '1px solid oklch(0.68 0.12 25 / 0.5)',
    },
  },
} as const;

// Typography Tokens
export const clientTypography = {
  fontFamily: {
    heading: "'Playfair Display', Georgia, serif",
    body: "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem',// 30px
    '4xl': '2.25rem', // 36px
  },
  
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

// Spacing Tokens (4px base unit)
export const clientSpacing = {
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
} as const;

// Border Radius Tokens
export const clientRadius = {
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  '2xl': '32px',
  full: '9999px',
} as const;

// Shadow Tokens
export const clientShadows = {
  sm: '0 1px 2px oklch(0.20 0.01 264 / 0.05)',
  md: '0 4px 6px oklch(0.20 0.01 264 / 0.07)',
  lg: '0 10px 15px oklch(0.20 0.01 264 / 0.1)',
  xl: '0 20px 25px oklch(0.20 0.01 264 / 0.1)',
} as const;

// Animation Tokens
export const clientAnimations = {
  duration: {
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
  },
  easing: {
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const;

// Touch Target Tokens (accessibility)
export const clientTouchTargets = {
  minimum: '48px',  // WCAG 2.1 minimum touch target
  comfortable: '56px',
  large: '64px',
} as const;

// Export all tokens as a single object
export const clientTheme = {
  colors: clientColors,
  glass: clientGlass,
  typography: clientTypography,
  spacing: clientSpacing,
  radius: clientRadius,
  shadows: clientShadows,
  animations: clientAnimations,
  touchTargets: clientTouchTargets,
} as const;

export default clientTheme;
