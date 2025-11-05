import React from 'react';
import { useTheme } from '@/hooks';
import Text from '../../atoms/Text';

interface FormFieldProps {
  label?: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  children: React.ReactNode;
  className?: string;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  required = false,
  error,
  helperText,
  children,
  className = ''
}) => {
  const { theme } = useTheme();

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    width: '100%'
  };

  const labelStyle: React.CSSProperties = {
    color: theme.colors.text.primary,
    marginBottom: '4px'
  };

  return (
    <div className={className} style={containerStyle}>
      {label && (
        <div style={labelStyle}>
          <Text variant="body2">
            {label}
            {required && (
              <span style={{ color: theme.colors.error.main, marginLeft: '2px' }}>
                *
              </span>
            )}
          </Text>
        </div>
      )}
      {children}
      {(error || helperText) && (
        <Text 
          variant="caption" 
          color={error ? theme.colors.error.main : theme.colors.text.secondary}
        >
          {error || helperText}
        </Text>
      )}
    </div>
  );
};

export default FormField;