import React, { useEffect } from 'react';
import { ToastProps } from '@/types/components';
import { useTheme } from '@/hooks';
import Icon from '@/components/atoms/Icon';
import Text from '@/components/atoms/Text';
import Button from '@/components/atoms/Button';

const Toast: React.FC<ToastProps> = ({
  message,
  severity = 'info',
  duration = 4000,
  action,
  onClose,
  position = 'top-right'
}) => {
  const { theme } = useTheme();

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const getSeverityStyles = () => {
    const colors = theme.colors;
    switch (severity) {
      case 'success':
        return { backgroundColor: colors.success.main, color: colors.success.contrastText, icon: 'check-circle' };
      case 'warning':
        return { backgroundColor: colors.warning.main, color: colors.warning.contrastText, icon: 'alert-triangle' };
      case 'error':
        return { backgroundColor: colors.error.main, color: colors.error.contrastText, icon: 'alert-circle' };
      default:
        return { backgroundColor: colors.info.main, color: colors.info.contrastText, icon: 'info' };
    }
  };

  const getPositionStyles = () => {
    const base = { position: 'fixed' as const, zIndex: 1400 };
    switch (position) {
      case 'top-left':
        return { ...base, top: theme.spacing.values.md, left: theme.spacing.values.md };
      case 'top-center':
        return { ...base, top: theme.spacing.values.md, left: '50%', transform: 'translateX(-50%)' };
      case 'top-right':
        return { ...base, top: theme.spacing.values.md, right: theme.spacing.values.md };
      case 'bottom-left':
        return { ...base, bottom: theme.spacing.values.md, left: theme.spacing.values.md };
      case 'bottom-center':
        return { ...base, bottom: theme.spacing.values.md, left: '50%', transform: 'translateX(-50%)' };
      case 'bottom-right':
        return { ...base, bottom: theme.spacing.values.md, right: theme.spacing.values.md };
      default:
        return { ...base, top: theme.spacing.values.md, right: theme.spacing.values.md };
    }
  };

  const severityStyles = getSeverityStyles();
  const positionStyles = getPositionStyles();

  const toastStyle: React.CSSProperties = {
    ...positionStyles,
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing.values.sm,
    padding: theme.spacing.values.md,
    backgroundColor: severityStyles.backgroundColor,
    color: severityStyles.color,
    borderRadius: '6px',
    boxShadow: theme.shadows.elevation['8'],
    minWidth: '300px',
    maxWidth: '500px'
  };

  return (
    <div style={toastStyle}>
      <Icon name={severityStyles.icon} size={20} />
      <Text variant="body2" style={{ flex: 1, color: 'inherit' }}>
        {message}
      </Text>
      {action}
      <Button 
        variant="icon" 
        onClick={onClose} 
        icon="x" 
        size="small"
        style={{ color: 'inherit' }}
      />
    </div>
  );
};

export default Toast;