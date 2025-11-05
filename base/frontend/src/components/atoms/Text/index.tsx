import React from 'react';
import { useTheme } from '@/hooks';

interface TextProps {
  variant?: 'h1' | 'h2' | 'h3' | 'body1' | 'body2' | 'caption' | 'overline';
  children: React.ReactNode;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}

const Text: React.FC<TextProps> = ({ variant = 'body1', children, color, className = '', style }) => {
  const { theme } = useTheme();
  const typography = theme.typography[variant];
  
  const Component = variant.startsWith('h') ? variant : 'span';
  
  const textStyle: React.CSSProperties = {
    fontFamily: theme.typography.fontFamily,
    fontSize: typography.fontSize,
    fontWeight: typography.fontWeight,
    lineHeight: typography.lineHeight,
    color: color || theme.colors.text.primary,
    textTransform: typography.textTransform as React.CSSProperties['textTransform'],
    letterSpacing: typography.letterSpacing,
    margin: 0,
    ...style
  };

  return React.createElement(
    Component,
    {
      className,
      style: textStyle
    },
    children
  );
};

export default Text;