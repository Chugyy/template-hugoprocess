import React from 'react';
import { useTheme } from '@/hooks';
import Icon from '../Icon';

interface InputProps {
  type?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyPress?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  startIcon?: string;
  endIcon?: string;
  fullWidth?: boolean;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const Input: React.FC<InputProps> = ({
  type = 'text',
  value,
  onChange,
  onKeyPress,
  placeholder,
  disabled = false,
  error = false,
  helperText,
  startIcon,
  endIcon,
  fullWidth = false,
  size = 'medium',
  className = ''
}) => {
  const { theme } = useTheme();
  
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { 
          padding: `${theme.components.padding.small.vertical}px ${theme.components.padding.small.horizontal}px`, 
          fontSize: '0.875rem', 
          minHeight: `${theme.components.heights.small}px` 
        };
      case 'large':
        return { 
          padding: `${theme.components.padding.large.vertical}px ${theme.components.padding.large.horizontal}px`, 
          fontSize: '1.125rem', 
          minHeight: `${theme.components.heights.large}px` 
        };
      default:
        return { 
          padding: `${theme.components.padding.medium.vertical}px ${theme.components.padding.medium.horizontal}px`, 
          fontSize: '1rem', 
          minHeight: `${theme.components.heights.medium}px` 
        };
    }
  };

  const inputStyle: React.CSSProperties = {
    border: `1px solid ${error ? theme.colors.error.main : theme.colors.divider}`,
    borderRadius: `${theme.components.borderRadius.medium}px`,
    fontFamily: theme.typography.fontFamily,
    color: theme.colors.text.primary,
    backgroundColor: theme.colors.background.paper,
    width: fullWidth ? '100%' : 'auto',
    outline: 'none',
    transition: 'all 0.2s ease',
    ...getSizeStyles()
  };

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    width: fullWidth ? '100%' : 'auto'
  };

  const iconStyle: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    color: theme.colors.text.secondary,
    pointerEvents: 'none'
  };

  return (
    <div style={{ width: fullWidth ? '100%' : 'auto' }}>
      <div style={containerStyle}>
        {startIcon && (
          <span style={{ ...iconStyle, left: `${theme.components.icon.offset}px` }}>
            <Icon name={startIcon} size={theme.components.icon.size} />
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={onChange}
          onKeyPress={onKeyPress}
          placeholder={placeholder}
          disabled={disabled}
          className={className}
          style={{
            ...inputStyle,
            paddingLeft: startIcon ? `${theme.components.icon.offset * 2 + theme.components.icon.size}px` : inputStyle.padding,
            paddingRight: endIcon ? `${theme.components.icon.offset * 2 + theme.components.icon.size}px` : inputStyle.padding
          }}
        />
        {endIcon && (
          <span style={{ ...iconStyle, right: `${theme.components.icon.offset}px` }}>
            <Icon name={endIcon} size={theme.components.icon.size} />
          </span>
        )}
      </div>
      {helperText && (
        <div style={{ 
          marginTop: '4px', 
          fontSize: '0.75rem', 
          color: error ? theme.colors.error.main : theme.colors.text.secondary 
        }}>
          {helperText}
        </div>
      )}
    </div>
  );
};

export default Input;