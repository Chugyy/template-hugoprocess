import React from 'react';
import { ButtonProps } from '@/types/components';
import { useTheme } from '@/hooks';
import Icon from '../Icon';
import Text from '../Text';
import Tag from '../Tag';

const Button: React.FC<ButtonProps> = ({
  label,
  icon,
  iconPosition = 'start',
  loading = false,
  disabled = false,
  fullWidth = false,
  type = 'button',
  href,
  onClick,
  variant = 'primary',
  size = 'medium',
  tag,
  className = '',
  style,
  children
}) => {
  const { theme } = useTheme();
  const [isHovered, setIsHovered] = React.useState(false);
  
  const getVariantStyles = () => {
    const colors = theme.colors;
    
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: isHovered && !disabled ? colors.primary.dark : colors.primary.main,
          color: colors.primary.contrastText,
          border: 'none'
        };
      case 'secondary':
        return {
          backgroundColor: isHovered && !disabled ? colors.secondary.dark : colors.secondary.main,
          color: colors.secondary.contrastText,
          border: 'none'
        };
      case 'tertiary':
        return {
          backgroundColor: isHovered && !disabled ? colors.primary.main : 'transparent',
          color: isHovered && !disabled ? colors.primary.contrastText : colors.primary.main,
          border: `1px solid ${colors.primary.main}`
        };
      case 'danger':
        return {
          backgroundColor: isHovered && !disabled ? colors.error.dark : colors.error.main,
          color: colors.error.contrastText,
          border: 'none'
        };
      case 'icon':
        return {
          backgroundColor: isHovered && !disabled ? colors.action.hover : 'transparent',
          color: colors.text.primary,
          border: 'none'
        };
      default:
        return {
          backgroundColor: isHovered && !disabled ? colors.action.hover : 'transparent',
          color: colors.text.primary,
          border: 'none'
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        if (icon && !children && !label) {
          return { 
            padding: `${theme.components.padding.small.vertical}px`, 
            minHeight: `${theme.components.heights.small}px`, 
            minWidth: `${theme.components.heights.small}px`, 
            fontSize: '0.875rem' 
          };
        }
        return { 
          padding: `${theme.components.padding.small.vertical}px ${theme.components.padding.small.horizontal}px`, 
          minHeight: `${theme.components.heights.small}px`, 
          fontSize: '0.875rem' 
        };
      case 'large':
        if (icon && !children && !label) {
          return { 
            padding: `${theme.components.padding.large.vertical}px`, 
            minHeight: `${theme.components.heights.large}px`, 
            minWidth: `${theme.components.heights.large}px`, 
            fontSize: '1.125rem' 
          };
        }
        return { 
          padding: `${theme.components.padding.large.vertical}px ${theme.components.padding.large.horizontal}px`, 
          minHeight: `${theme.components.heights.large}px`, 
          fontSize: '1.125rem' 
        };
      default:
        if (icon && !children && !label) {
          return { 
            padding: `${theme.components.padding.medium.vertical}px`, 
            minHeight: `${theme.components.heights.medium}px`, 
            minWidth: `${theme.components.heights.medium}px`, 
            fontSize: '1rem' 
          };
        }
        return { 
          padding: `${theme.components.padding.medium.vertical}px ${theme.components.padding.medium.horizontal}px`, 
          minHeight: `${theme.components.heights.medium}px`, 
          fontSize: '1rem' 
        };
    }
  };

  // Détermine si c'est un bouton icon-only
  const isIconOnly = icon && !label && !children;

  const buttonStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: isIconOnly ? '0px' : `${theme.components.gaps.standard}px`,
    position: 'relative',
    borderRadius: `${theme.components.borderRadius.medium}px`,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: theme.typography.fontFamily,
    fontWeight: 500,
    textDecoration: 'none',
    width: fullWidth ? '100%' : 'auto',
    opacity: disabled ? 0.6 : 1,
    transition: 'all 0.2s ease',
    ...getVariantStyles(),
    ...getSizeStyles(),
    ...style
  };

  const content = (
    <>
      {loading && <Icon name="spinner" size={theme.components.icon.size} />}
      {icon && iconPosition === 'start' && !loading && <Icon name={icon} size={theme.components.icon.size} />}
      {(label || children) && (
        <Text variant="body2" color="inherit">
          {children || label}
        </Text>
      )}
      {icon && iconPosition === 'end' && !loading && <Icon name={icon} size={theme.components.icon.size} />}
      {tag && !isIconOnly && (
        <Tag
          {...tag}
          size="small"
        />
      )}
      {tag && isIconOnly && (
        <Tag
          {...tag}
          size="small"
          style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            ...tag.style
          }}
        />
      )}
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        className={className}
        style={buttonStyle}
        onClick={disabled ? undefined : onClick}
        onMouseEnter={() => !disabled && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      type={type}
      className={className}
      style={buttonStyle}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      onMouseEnter={() => !disabled && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {content}
    </button>
  );
};

export default Button;