import React, { useEffect } from 'react';
import { ModalProps } from '@/types/components';
import { useTheme } from '@/hooks';
import Button from '@/components/atoms/Button';
import Text from '@/components/atoms/Text';

const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  size = 'medium',
  closeOnOverlayClick = true,
  closeOnEscape = true,
  title,
  children,
  actions,
  className = ''
}) => {
  const { theme } = useTheme();

  useEffect(() => {
    if (!closeOnEscape) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (open) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'auto';
    };
  }, [open, closeOnEscape, onClose]);

  if (!open) return null;

  const getModalWidth = () => {
    switch (size) {
      case 'small': return `${theme.layout.modal.maxWidth.small}px`;
      case 'large': return `${theme.layout.modal.maxWidth.large}px`;
      case 'fullscreen': return '100vw';
      default: return `${theme.layout.modal.maxWidth.medium}px`;
    }
  };

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1300,
    padding: size === 'fullscreen' ? 0 : theme.spacing.values.md
  };

  const modalStyle: React.CSSProperties = {
    backgroundColor: theme.colors.background.paper,
    borderRadius: size === 'fullscreen' ? 0 : `${theme.layout.modal.radius}px`,
    boxShadow: theme.shadows.elevation['16'],
    maxWidth: getModalWidth(),
    width: '100%',
    maxHeight: size === 'fullscreen' ? '100vh' : '90vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column'
  };

  return (
    <div 
      style={overlayStyle} 
      onClick={closeOnOverlayClick ? onClose : undefined}
    >
      <div 
        className={className}
        style={modalStyle} 
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <header style={{ 
            padding: theme.spacing.values.lg,
            borderBottom: `1px solid ${theme.colors.divider}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Text variant="h3">{title}</Text>
            <Button variant="icon" onClick={onClose} icon="x" />
          </header>
        )}
        
        <div style={{ 
          flex: 1, 
          padding: theme.spacing.values.lg, 
          overflow: 'auto' 
        }}>
          {children}
        </div>

        {actions && (
          <footer style={{ 
            padding: theme.spacing.values.lg,
            borderTop: `1px solid ${theme.colors.divider}`,
            display: 'flex',
            justifyContent: 'flex-end',
            gap: theme.spacing.values.sm
          }}>
            {actions}
          </footer>
        )}
      </div>
    </div>
  );
};

export default Modal;