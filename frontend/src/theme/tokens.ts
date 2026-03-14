/**
 * UniSync Design Tokens — JavaScript export
 * For programmatic access in components and Tailwind config.
 */

export const tokens = {
  colors: {
    cyan500: '#06B6D4',
    cyan400: '#22D3EE',
    cyan300: '#67E8F9',
    blue600: '#2563EB',
    blue500: '#3B82F6',
    purple600: '#9333EA',
    bgDark: '#000000',
    bgDarkMid: '#111827',
    textPrimary: '#FFFFFF',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    riskLow: '#10B981',
    riskMedium: '#F59E0B',
    riskHigh: '#EF4444',
  },
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '6xl': '3.75rem',
  },
  radius: {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    '2xl': '1.25rem',
    '3xl': '1.5rem',
    full: '9999px',
  },
  transition: {
    fast: '150ms ease',
    normal: '200ms ease',
    slow: '300ms ease',
    spring: '300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
} as const;

export type Tokens = typeof tokens;

/** Risk level → color mapping */
export const riskColorMap = {
  low: tokens.colors.riskLow,
  medium: tokens.colors.riskMedium,
  high: tokens.colors.riskHigh,
} as const;
