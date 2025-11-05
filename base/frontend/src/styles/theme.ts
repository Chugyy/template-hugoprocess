import { Theme } from '@/types';

export const lightTheme: Theme = {
  colors: {
    primary: {
      main: '#2563eb',
      light: '#60a5fa',
      dark: '#1d4ed8',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#dc004e',
      light: '#f73378',
      dark: '#9a0036',
      contrastText: '#ffffff',
    },
    success: {
      main: '#059669',
      light: '#10b981',
      dark: '#047857',
      contrastText: '#ffffff',
    },
    warning: {
      main: '#d97706',
      light: '#f59e0b',
      dark: '#b45309',
      contrastText: '#ffffff',
    },
    error: {
      main: '#dc2626',
      light: '#ef4444',
      dark: '#b91c1c',
      contrastText: '#ffffff',
    },
    info: {
      main: '#0ea5e9',
      light: '#38bdf8',
      dark: '#0284c7',
      contrastText: '#ffffff',
    },
    text: {
      primary: '#1f2937',
      secondary: '#6b7280',
      disabled: '#9ca3af',
    },
    background: {
      default: '#f9fafb',
      paper: '#ffffff',
    },
    action: {
      hover: 'rgba(0, 0, 0, 0.04)',
      selected: 'rgba(37, 99, 235, 0.1)',
      disabled: 'rgba(0, 0, 0, 0.26)',
      disabledBackground: 'rgba(0, 0, 0, 0.12)',
    },
    divider: '#e5e7eb',
  },
  typography: {
    fontFamily: "'Poppins', 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    body1: {
      fontSize: '1rem',
      fontWeight: 400,
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem',
      fontWeight: 400,
      lineHeight: 1.43,
    },
    caption: {
      fontSize: '0.75rem',
      fontWeight: 400,
      lineHeight: 1.66,
    },
    overline: {
      fontSize: '0.75rem',
      fontWeight: 500,
      lineHeight: 2.66,
      textTransform: 'uppercase',
      letterSpacing: '1px',
    },
  },
  spacing: {
    unit: 8,
    values: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
      xxl: 48,
    },
  },
  breakpoints: {
    xs: 0,
    sm: 600,
    md: 960,
    lg: 1280,
    xl: 1920,
  },
  shadows: {
    elevation: {
      '0': 'none',
      '1': '0px 1px 3px rgba(0,0,0,0.12)',
      '2': '0px 1px 5px rgba(0,0,0,0.12)',
      '4': '0px 2px 8px rgba(0,0,0,0.15)',
      '6': '0px 3px 12px rgba(0,0,0,0.15)',
      '8': '0px 4px 16px rgba(0,0,0,0.15)',
      '12': '0px 6px 24px rgba(0,0,0,0.15)',
      '16': '0px 8px 32px rgba(0,0,0,0.15)',
      '24': '0px 12px 48px rgba(0,0,0,0.15)',
    },
  },
  animations: {
    duration: {
      shortest: 150,
      shorter: 200,
      short: 250,
      standard: 300,
      complex: 375,
      enteringScreen: 225,
      leavingScreen: 195,
    },
    easing: {
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
    },
  },
  components: {
    heights: {
      small: 32,
      medium: 40,
      large: 48,
    },
    padding: {
      small: { vertical: 6, horizontal: 12 },
      medium: { vertical: 10, horizontal: 16 },
      large: { vertical: 12, horizontal: 24 },
    },
    borderRadius: {
      small: 4,
      medium: 6,
      large: 8,
      pill: 12,
    },
    icon: {
      offset: 12,
      size: 16,
    },
    gaps: {
      tight: 4,
      standard: 8,
      loose: 12,
    },
  },
  layout: {
    container: {
      padding: 16,
      gap: 16,
    },
    modal: {
      radius: 8,
      maxWidth: {
        small: 400,
        medium: 600,
        large: 800,
      },
    },
    transitions: {
      default: 'all 0.2s ease',
    },
  },
};

export const darkTheme: Theme = {
  colors: {
    primary: {
      main: '#3b82f6',
      light: '#60a5fa',
      dark: '#2563eb',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#ec4899',
      light: '#f472b6',
      dark: '#db2777',
      contrastText: '#ffffff',
    },
    success: {
      main: '#10b981',
      light: '#34d399',
      dark: '#059669',
      contrastText: '#ffffff',
    },
    warning: {
      main: '#f59e0b',
      light: '#fbbf24',
      dark: '#d97706',
      contrastText: '#ffffff',
    },
    error: {
      main: '#ef4444',
      light: '#f87171',
      dark: '#dc2626',
      contrastText: '#ffffff',
    },
    info: {
      main: '#06b6d4',
      light: '#22d3ee',
      dark: '#0891b2',
      contrastText: '#ffffff',
    },
    text: {
      primary: '#f8fafc',
      secondary: '#cbd5e1',
      disabled: '#64748b',
    },
    background: {
      default: '#0f1419',
      paper: '#1a1f2e',
    },
    action: {
      hover: 'rgba(255, 255, 255, 0.08)',
      selected: 'rgba(59, 130, 246, 0.2)',
      disabled: 'rgba(255, 255, 255, 0.3)',
      disabledBackground: 'rgba(255, 255, 255, 0.12)',
    },
    divider: '#334155',
  },
  typography: {
    fontFamily: "'Poppins', 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    body1: {
      fontSize: '1rem',
      fontWeight: 400,
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem',
      fontWeight: 400,
      lineHeight: 1.43,
    },
    caption: {
      fontSize: '0.75rem',
      fontWeight: 400,
      lineHeight: 1.66,
    },
    overline: {
      fontSize: '0.75rem',
      fontWeight: 500,
      lineHeight: 2.66,
      textTransform: 'uppercase',
      letterSpacing: '1px',
    },
  },
  spacing: {
    unit: 8,
    values: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
      xxl: 48,
    },
  },
  breakpoints: {
    xs: 0,
    sm: 600,
    md: 960,
    lg: 1280,
    xl: 1920,
  },
  shadows: {
    elevation: {
      '0': 'none',
      '1': '0px 1px 3px rgba(0,0,0,0.3)',
      '2': '0px 1px 5px rgba(0,0,0,0.3)',
      '4': '0px 2px 8px rgba(0,0,0,0.4)',
      '6': '0px 3px 12px rgba(0,0,0,0.4)',
      '8': '0px 4px 16px rgba(0,0,0,0.4)',
      '12': '0px 6px 24px rgba(0,0,0,0.4)',
      '16': '0px 8px 32px rgba(0,0,0,0.4)',
      '24': '0px 12px 48px rgba(0,0,0,0.4)',
    },
  },
  animations: {
    duration: {
      shortest: 150,
      shorter: 200,
      short: 250,
      standard: 300,
      complex: 375,
      enteringScreen: 225,
      leavingScreen: 195,
    },
    easing: {
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
    },
  },
  components: {
    heights: {
      small: 32,
      medium: 40,
      large: 48,
    },
    padding: {
      small: { vertical: 6, horizontal: 12 },
      medium: { vertical: 10, horizontal: 16 },
      large: { vertical: 12, horizontal: 24 },
    },
    borderRadius: {
      small: 4,
      medium: 6,
      large: 8,
      pill: 12,
    },
    icon: {
      offset: 12,
      size: 16,
    },
    gaps: {
      tight: 4,
      standard: 8,
      loose: 12,
    },
  },
  layout: {
    container: {
      padding: 16,
      gap: 16,
    },
    modal: {
      radius: 8,
      maxWidth: {
        small: 400,
        medium: 600,
        large: 800,
      },
    },
    transitions: {
      default: 'all 0.2s ease',
    },
  },
};

export const defaultTheme = lightTheme;