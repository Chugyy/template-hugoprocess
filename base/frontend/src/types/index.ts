export interface Theme {
  colors: {
    primary: ColorPalette;
    secondary: ColorPalette;
    success: ColorPalette;
    warning: ColorPalette;
    error: ColorPalette;
    info: ColorPalette;
    text: TextColors;
    background: BackgroundColors;
    action: ActionColors;
    divider: string;
  };
  typography: Typography;
  spacing: Spacing;
  breakpoints: Breakpoints;
  shadows: Shadows;
  animations: Animations;
  components: {
    heights: {
      small: number;
      medium: number;
      large: number;
    };
    padding: {
      small: { vertical: number; horizontal: number };
      medium: { vertical: number; horizontal: number };
      large: { vertical: number; horizontal: number };
    };
    borderRadius: {
      small: number;
      medium: number;
      large: number;
      pill: number;
    };
    icon: {
      offset: number;
      size: number;
    };
    gaps: {
      tight: number;
      standard: number;
      loose: number;
    };
  };
  layout: {
    container: {
      padding: number;
      gap: number;
    };
    modal: {
      radius: number;
      maxWidth: {
        small: number;
        medium: number;
        large: number;
      };
    };
    transitions: {
      default: string;
    };
  };
}

export interface ColorPalette {
  main: string;
  light: string;
  dark: string;
  contrastText: string;
}

export interface TextColors {
  primary: string;
  secondary: string;
  disabled: string;
}

export interface BackgroundColors {
  default: string;
  paper: string;
}

export interface ActionColors {
  hover: string;
  selected: string;
  disabled: string;
  disabledBackground: string;
}

export interface Typography {
  fontFamily: string;
  h1: TypographyVariant;
  h2: TypographyVariant;
  h3: TypographyVariant;
  body1: TypographyVariant;
  body2: TypographyVariant;
  caption: TypographyVariant;
  overline: TypographyVariant;
}

export interface TypographyVariant {
  fontSize: string;
  fontWeight: number;
  lineHeight: number;
  textTransform?: string;
  letterSpacing?: string;
}

export interface Spacing {
  unit: number;
  values: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
}

export interface Breakpoints {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
}

export interface Shadows {
  elevation: Record<string, string>;
}

export interface Animations {
  duration: {
    shortest: number;
    shorter: number;
    short: number;
    standard: number;
    complex: number;
    enteringScreen: number;
    leavingScreen: number;
  };
  easing: {
    easeInOut: string;
    easeOut: string;
    easeIn: string;
    sharp: string;
  };
}