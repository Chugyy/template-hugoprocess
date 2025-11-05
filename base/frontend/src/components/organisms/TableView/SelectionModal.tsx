import React from 'react';
import { ActionConfig } from '@/types/components';
import { useTheme } from '@/hooks';
import Button from '@/components/atoms/Button';
import Text from '@/components/atoms/Text';
import Icon from '@/components/atoms/Icon';

interface SelectionModalProps {
  selectedCount: number;
  actions: ActionConfig[];
  onAction: (action: ActionConfig) => void;
  onCancel: () => void;
}

const SelectionModal: React.FC<SelectionModalProps> = ({
  selectedCount,
  actions,
  onAction,
  onCancel
}) => {
  const { theme } = useTheme();

  const modalStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: '24px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '90%',
    maxWidth: '800px',
    height: '10vh',
    minHeight: '80px',
    maxHeight: '120px',
    backgroundColor: theme.colors.background.paper,
    border: `1px solid ${theme.colors.divider}`,
    borderRadius: '12px',
    boxShadow: theme.shadows.elevation['16'] || '0 16px 32px rgba(0,0,0,0.15)',
    padding: theme.spacing.values.lg,
    zIndex: 1300,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.values.md
  };

  const leftSectionStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing.values.sm
  };

  const rightSectionStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing.values.sm
  };

  return (
    <div style={modalStyle}>
      <div style={leftSectionStyle}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <Text variant="body1" style={{ fontWeight: 600, margin: 0 }}>
            {selectedCount} element{selectedCount > 1 ? 's' : ''} sélectionné{selectedCount > 1 ? 's' : ''}
          </Text>
          <Text variant="body2" style={{ color: theme.colors.text.secondary, margin: 0 }}>
            Choisissez une action à effectuer sur la sélection
          </Text>
        </div>
      </div>

      <div style={rightSectionStyle}>
        {actions.map(action => (
          <Button
            key={action.key}
            variant={action.variant || 'primary'}
            size="medium"
            icon={action.icon}
            onClick={() => onAction(action)}
          >
            {action.label}
          </Button>
        ))}
        <Button
          variant="tertiary"
          size="medium"
          icon="x"
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default SelectionModal;