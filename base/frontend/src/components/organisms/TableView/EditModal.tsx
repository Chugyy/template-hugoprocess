import React, { useState, useEffect } from 'react';
import { FieldConfig } from '@/types/components';
import { useTheme } from '@/hooks';
import Text from '@/components/atoms/Text';
import Button from '@/components/atoms/Button';
import Input from '@/components/atoms/Input';
import Tag from '@/components/atoms/Tag';
import Icon from '@/components/atoms/Icon';
import Select, { SelectOption } from '@/components/atoms/Select';

interface EditModalProps<T = any> {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: T) => void;
  data: T;
  fields: FieldConfig[];
  title?: string;
}

const EditModal = <T extends Record<string, any>>({
  isOpen,
  onClose,
  onSave,
  data,
  fields,
  title = 'Edit Item'
}: EditModalProps<T>) => {
  const { theme } = useTheme();
  const [formData, setFormData] = useState<T>(data);

  useEffect(() => {
    setFormData(data);
  }, [data]);

  if (!isOpen) return null;

  const handleInputChange = (fieldKey: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldKey]: value
    }));
  };

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  const renderField = (field: FieldConfig) => {
    if (field.type === 'actions') return null;

    const value = formData[field.key];

    switch (field.type) {
      case 'input':
      case 'text':
        return (
          <Input
            label={field.label}
            value={value || ''}
            onChange={(e) => handleInputChange(field.key, e.target.value)}
            fullWidth
          />
        );
      
      case 'number':
        return (
          <Input
            label={field.label}
            type="number"
            value={value || ''}
            onChange={(e) => handleInputChange(field.key, parseFloat(e.target.value) || 0)}
            fullWidth
          />
        );
      
      case 'date':
        return (
          <Input
            label={field.label}
            type="date"
            value={value || ''}
            onChange={(e) => handleInputChange(field.key, e.target.value)}
            fullWidth
          />
        );
      
      case 'select':
      case 'dropdown':
        const options = field.options || [];
        const selectOptions: SelectOption[] = options.map((opt: any) => ({
          value: opt.value,
          label: opt.label,
          icon: opt.icon,
          tag: opt.tag,
          tagColor: opt.tagColor
        }));
        return (
          <Select
            value={value || ''}
            options={selectOptions}
            onChange={(newValue) => handleInputChange(field.key, newValue)}
            label={field.label}
            fullWidth
          />
        );
      
      case 'tag':
        const tagOptions = field.options || [];
        if (tagOptions.length > 0) {
          const tagSelectOptions: SelectOption[] = tagOptions.map((opt: any) => ({
            value: opt.value,
            label: opt.label,
            icon: opt.icon,
            tag: opt.tag,
            tagColor: opt.tagColor
          }));
          return (
            <Select
              value={value || ''}
              options={tagSelectOptions}
              onChange={(newValue) => handleInputChange(field.key, newValue)}
              label={field.label}
              fullWidth
            />
          );
        }
        return (
          <Input
            label={field.label}
            value={value || ''}
            onChange={(e) => handleInputChange(field.key, e.target.value)}
            fullWidth
          />
        );
      
      case 'checkbox':
      case 'boolean':
        return (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: `${theme.components.gaps.standard}px`,
            padding: `${theme.components.gaps.standard}px`,
            backgroundColor: theme.colors.background.default,
            borderRadius: `${theme.components.borderRadius.small}px`,
            border: `1px solid ${theme.colors.divider}`
          }}>
            <input
              type="checkbox"
              checked={Boolean(value)}
              onChange={(e) => handleInputChange(field.key, e.target.checked)}
              style={{ 
                cursor: 'pointer',
                width: '18px',
                height: '18px'
              }}
              id={`checkbox-${field.key}`}
            />
            <label 
              htmlFor={`checkbox-${field.key}`}
              style={{ cursor: 'pointer' }}
            >
              <Text variant="body2">{field.label}</Text>
            </label>
          </div>
        );
      
      default:
        return (
          <Input
            label={field.label}
            value={value || ''}
            onChange={(e) => handleInputChange(field.key, e.target.value)}
            fullWidth
          />
        );
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
    zIndex: 1000
  };

  const modalStyle: React.CSSProperties = {
    backgroundColor: theme.colors.background.paper,
    borderRadius: `${theme.components.borderRadius.large}px`,
    padding: `${theme.layout.container.padding * 1.5}px`,
    maxWidth: '500px',
    width: '90%',
    maxHeight: '80vh',
    overflow: 'auto',
    boxShadow: theme.shadows.elevation['8']
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: `${theme.layout.container.gap}px`,
    borderBottom: `1px solid ${theme.colors.divider}`,
    paddingBottom: `${theme.layout.container.padding}px`
  };

  const formStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: `${theme.layout.container.gap}px`,
    marginBottom: `${theme.layout.container.gap}px`
  };

  const actionsStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: `${theme.components.gaps.standard}px`,
    borderTop: `1px solid ${theme.colors.divider}`,
    paddingTop: `${theme.layout.container.padding}px`
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <Text variant="h3" style={{ margin: 0 }}>
            {title}
          </Text>
          <Button
            variant="tertiary"
            size="small"
            icon="x"
            onClick={onClose}
          />
        </div>

        <div style={formStyle}>
          {fields
            .filter(field => field.type !== 'actions')
            .map(field => (
              <div key={field.key}>
                {renderField(field)}
              </div>
            ))}
        </div>

        <div style={actionsStyle}>
          <Button
            variant="secondary"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EditModal;