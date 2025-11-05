import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '@/hooks';
import Text from '@/components/atoms/Text';
import Icon from '@/components/atoms/Icon';
import Tag from '@/components/atoms/Tag';

export interface SelectOption {
  value: string | number;
  label: string;
  icon?: string;
  tag?: string | number;
  tagColor?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  disabled?: boolean;
}

interface SelectProps {
  value: any;
  options: SelectOption[];
  onChange: (value: any) => void;
  placeholder?: string;
  label?: string;
  fullWidth?: boolean;
  error?: string;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const Select: React.FC<SelectProps> = ({
  value,
  options,
  onChange,
  placeholder = 'Select...',
  label,
  fullWidth = false,
  error,
  disabled = false,
  size = 'medium'
}) => {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          minHeight: `${theme.components.heights.small}px`,
          padding: `${theme.components.padding.small.vertical}px ${theme.components.padding.small.horizontal}px`,
          fontSize: '0.875rem'
        };
      case 'large':
        return {
          minHeight: `${theme.components.heights.large}px`,
          padding: `${theme.components.padding.large.vertical}px ${theme.components.padding.large.horizontal}px`,
          fontSize: '1.125rem'
        };
      default:
        return {
          minHeight: `${theme.components.heights.medium}px`,
          padding: `${theme.components.padding.medium.vertical}px ${theme.components.padding.medium.horizontal}px`,
          fontSize: '1rem'
        };
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    width: fullWidth ? '100%' : 'auto',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: theme.spacing.values.xs,
    fontSize: '14px',
    fontWeight: 500,
    color: theme.colors.text.primary,
  };

  const sizeStyles = getSizeStyles();
  
  const buttonStyle: React.CSSProperties = {
    width: '100%',
    paddingRight: `${theme.components.icon.offset * 2 + theme.components.icon.size}px`,
    border: `1px solid ${error ? theme.colors.error.main : theme.colors.divider}`,
    borderRadius: `${theme.components.borderRadius.medium}px`,
    backgroundColor: disabled ? theme.colors.action.disabledBackground : theme.colors.background.paper,
    color: selectedOption ? theme.colors.text.primary : theme.colors.text.secondary,
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...sizeStyles,
    gap: `${theme.components.gaps.standard}px`,
    transition: 'all 0.2s ease',
    outline: 'none',
    position: 'relative',
    textAlign: 'left',
    minHeight: `${theme.components.heights.medium}px`,
  };

  const chevronStyle: React.CSSProperties = {
    position: 'absolute',
    right: `${theme.components.icon.offset}px`,
    top: '50%',
    transform: `translateY(-50%) ${isOpen ? 'rotate(180deg)' : 'rotate(0)'}`,
    transition: 'transform 0.2s ease',
    pointerEvents: 'none',
  };

  const menuStyle: React.CSSProperties = {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: '4px',
    backgroundColor: theme.colors.background.paper,
    border: `1px solid ${theme.colors.divider}`,
    borderRadius: `${theme.components.borderRadius.medium}px`,
    boxShadow: theme.shadows.elevation['4'],
    zIndex: 1000,
    maxHeight: '300px',
    overflowY: 'auto',
    display: isOpen ? 'block' : 'none',
  };

  const optionStyle = (option: SelectOption): React.CSSProperties => ({
    padding: `${sizeStyles.padding}`,
    cursor: option.disabled ? 'not-allowed' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: `${theme.components.gaps.standard}px`,
    backgroundColor: option.value === value ? theme.colors.action.selected : 'transparent',
    opacity: option.disabled ? 0.5 : 1,
    transition: 'background-color 0.2s ease',
    minHeight: `${sizeStyles.minHeight}px`,
    fontSize: sizeStyles.fontSize,
  });

  const optionContentStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: `${theme.components.gaps.standard}px`,
    flex: 1,
    minWidth: 0,
  };

  const optionTextStyle: React.CSSProperties = {
    flex: 1,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  };

  const handleOptionClick = (option: SelectOption) => {
    if (option.disabled) return;
    onChange(option.value);
    setIsOpen(false);
  };

  const handleButtonClick = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div style={containerStyle} ref={dropdownRef}>
      {label && (
        <label style={labelStyle}>
          {label}
        </label>
      )}
      
      <button
        type="button"
        style={buttonStyle}
        onClick={handleButtonClick}
        onMouseEnter={(e) => {
          if (!disabled) {
            e.currentTarget.style.borderColor = theme.colors.primary.main;
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled) {
            e.currentTarget.style.borderColor = error ? theme.colors.error.main : theme.colors.divider;
          }
        }}
      >
        <div style={optionContentStyle}>
          {selectedOption?.icon && (
            <Icon name={selectedOption.icon} size={theme.components.icon.size} />
          )}
          <span style={optionTextStyle}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <div style={chevronStyle}>
          <Icon name="chevron-down" size={theme.components.icon.size} />
        </div>
      </button>

      <div style={menuStyle}>
        {options.map((option) => (
          <div
            key={option.value}
            style={optionStyle(option)}
            onClick={() => handleOptionClick(option)}
            onMouseEnter={(e) => {
              if (!option.disabled && option.value !== value) {
                e.currentTarget.style.backgroundColor = theme.colors.action.hover;
              }
            }}
            onMouseLeave={(e) => {
              if (option.value !== value) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            <div style={optionContentStyle}>
              {option.icon && (
                <Icon name={option.icon} size={theme.components.icon.size} />
              )}
              <span style={optionTextStyle}>
                {option.label}
              </span>
            </div>
            {option.tag && (
              <Tag
                label={option.tag}
                color={option.tagColor || 'primary'}
                size="small"
                variant="outlined"
              />
            )}
          </div>
        ))}
      </div>

      {error && (
        <Text 
          variant="caption" 
          style={{ 
            color: theme.colors.error.main, 
            marginTop: theme.spacing.values.xs 
          }}
        >
          {error}
        </Text>
      )}
    </div>
  );
};

export default Select;