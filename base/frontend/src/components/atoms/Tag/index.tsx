import React from 'react';
import { TagProps } from '@/types/components';
import { useTheme } from '@/hooks';
import Icon from '../Icon';

const Tag: React.FC<TagProps> = ({
  label,
  color = 'primary',
  size = 'medium',
  icon,
  onDelete,
  clickable = false,
  animate = 'none',
  variant = 'filled',
  className = '',
  style
}) => {
  const { theme } = useTheme();
  
  const getColorStyles = () => {
    const colors = theme.colors;
    const colorPalette = color === 'custom' ? colors.primary : (colors[color as keyof typeof colors] as any) || colors.primary;
    
    switch (variant) {
      case 'outlined':
        return {
          backgroundColor: 'transparent',
          color: colorPalette.main,
          border: `1px solid ${colorPalette.main}`
        };
      case 'dot':
        return {
          backgroundColor: theme.colors.background.paper,
          color: colors.text.primary,
          border: `1px solid ${theme.colors.divider}`,
          paddingLeft: '24px',
          position: 'relative' as const
        };
      case 'status':
        return {
          backgroundColor: colorPalette.main,
          color: colorPalette.contrastText,
          border: 'none',
          fontWeight: 600
        };
      default:
        return {
          backgroundColor: colorPalette.main,
          color: colorPalette.contrastText,
          border: 'none'
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { padding: '2px 8px', fontSize: '0.75rem', minHeight: '20px' };
      case 'large':
        return { padding: '6px 16px', fontSize: '1rem', minHeight: '32px' };
      default:
        return { padding: '4px 12px', fontSize: '0.875rem', minHeight: '24px' };
    }
  };

  const tagStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: `${theme.components.gaps.tight}px`,
    borderRadius: `${theme.components.borderRadius.pill}px`,
    fontFamily: theme.typography.fontFamily,
    fontWeight: 500,
    cursor: clickable ? 'pointer' : 'default',
    transition: 'all 0.2s ease',
    ...getColorStyles(),
    ...getSizeStyles(),
    ...style
  };

  const dotStyle: React.CSSProperties = {
    position: 'absolute',
    left: '8px',
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: color === 'custom' ? theme.colors.primary.main : ((theme.colors[color as keyof typeof theme.colors] as any)?.main || theme.colors.primary.main)
  };

  return (
    <span className={className} style={tagStyle}>
      {variant === 'dot' && <span style={dotStyle} />}
      {icon && <Icon name={icon} size={12} />}
      {label}
      {onDelete && (
        <button
          onClick={onDelete}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0',
            display: 'flex',
            alignItems: 'center',
            color: 'inherit'
          }}
        >
          <Icon name="x" size={12} />
        </button>
      )}
    </span>
  );
};

export default Tag;