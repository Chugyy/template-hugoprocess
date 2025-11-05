import React from 'react';
import { TableViewConfig, FieldConfig } from '@/types/components';
import { UseSearchEngineReturn } from '@/hooks/useSearchEngine';
import { useTheme } from '@/hooks';
import Text from '@/components/atoms/Text';
import Tag from '@/components/atoms/Tag';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';

interface ListLayoutProps<T = any> {
  config: TableViewConfig<T>;
  data: T[];
  totalCount: number;
  loading: boolean;
  searchEngine: UseSearchEngineReturn<T>;
  selectedIds?: Set<string>;
  onSelectionChange?: (selectedIds: Set<string>) => void;
  onRowAction?: (action: string, row: T) => void;
}

const ListLayout = <T extends Record<string, any>>({
  config,
  data,
  loading,
  selectedIds = new Set(),
  onSelectionChange,
  onRowAction
}: ListLayoutProps<T>) => {
  const { theme } = useTheme();

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: `${theme.components.gaps.tight}px`,
    backgroundColor: theme.colors.background.paper,
    borderRadius: `${theme.components.borderRadius.large}px`,
    border: `1px solid ${theme.colors.divider}`,
    overflow: 'hidden'
  };

  const itemStyle: React.CSSProperties = {
    padding: `${theme.layout.container.padding}px`,
    borderBottom: `1px solid ${theme.colors.divider}`,
    cursor: 'pointer',
    transition: 'background-color 0.2s ease'
  };

  const renderFieldContent = (field: FieldConfig, value: any, row: T) => {
    if (field.render) {
      return field.render(value, row);
    }

    switch (field.type) {
      case 'tag':
        return (
          <Tag
            label={value}
            variant="status"
            color={value === 'Active' ? 'success' : value === 'Inactive' ? 'error' : 'primary'}
            size="small"
          />
        );
      case 'actions':
        return (
          <div style={{ display: 'flex', gap: `${theme.components.gaps.tight}px`, justifyContent: 'flex-end' }}>
            {config.actions?.map(action => (
              <Button
                key={action.key}
                variant={action.variant || 'tertiary'}
                size="small"
                icon={action.icon}
                onClick={(e) => {
                  e.stopPropagation();
                  action.onClick(row);
                }}
              >
                {action.label}
              </Button>
            ))}
            <Button
              variant="primary"
              size="small"
              icon="edit"
              onClick={(e) => {
                e.stopPropagation();
                onRowAction?.('edit', row);
              }}
            >
              Edit
            </Button>
            <Button
              variant="danger"
              size="small"
              icon="trash"
              onClick={(e) => {
                e.stopPropagation();
                onRowAction?.('delete', row);
              }}
            >
              Delete
            </Button>
            <Button
              variant="tertiary"
              size="small"
              icon="copy"
              onClick={(e) => {
                e.stopPropagation();
                onRowAction?.('duplicate', row);
              }}
            >
              Duplicate
            </Button>
          </div>
        );
      default:
        return value;
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: `${theme.layout.container.padding * 2}px`,
        backgroundColor: theme.colors.background.paper,
        borderRadius: `${theme.components.borderRadius.large}px`,
        border: `1px solid ${theme.colors.divider}`
      }}>
        <Icon name="spinner" size={24} />
        <Text variant="body2" style={{ marginLeft: `${theme.components.gaps.standard}px` }}>
          Loading...
        </Text>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: `${theme.layout.container.padding * 2}px`,
        backgroundColor: theme.colors.background.paper,
        borderRadius: `${theme.components.borderRadius.large}px`,
        border: `1px solid ${theme.colors.divider}`,
        textAlign: 'center'
      }}>
        <Icon name="list" size={48} style={{ color: theme.colors.text.disabled, marginBottom: `${theme.layout.container.gap}px` }} />
        <Text variant="h3" style={{ marginBottom: `${theme.components.gaps.standard}px` }}>
          No data found
        </Text>
        <Text variant="body2" style={{ color: theme.colors.text.secondary }}>
          No items match your current search and filters
        </Text>
      </div>
    );
  }

  const handleSelectItem = (itemId: string) => {
    if (!onSelectionChange) return;
    const newSelection = new Set(selectedIds);
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId);
    } else {
      newSelection.add(itemId);
    }
    onSelectionChange(newSelection);
  };

  return (
    <div style={containerStyle}>
      {data.map((row, index) => {
        const itemId = row.id || String(row);
        const isSelected = selectedIds.has(itemId);
        const primaryField = config.fields.find(f => f.type === 'text') || config.fields[0];
        const secondaryField = config.fields.find(f => f.key !== primaryField.key && f.type === 'text');
        const tagFields = config.fields.filter(f => f.type === 'tag');
        const actionField = config.fields.find(f => f.type === 'actions');

        return (
          <div
            key={itemId}
            style={{
              ...itemStyle,
              borderBottom: index < data.length - 1 ? `1px solid ${theme.colors.divider}` : 'none',
              backgroundColor: isSelected ? theme.colors.action.selected || theme.colors.primary.light : 'transparent'
            }}
            onMouseEnter={(e) => {
              if (!isSelected) {
                e.currentTarget.style.backgroundColor = theme.colors.action.hover;
              }
            }}
            onMouseLeave={(e) => {
              if (!isSelected) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: `${theme.layout.container.gap}px`
            }}>
              {/* Checkbox */}
              <div style={{ flexShrink: 0, marginTop: '2px' }}>
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleSelectItem(itemId)}
                  style={{ cursor: 'pointer' }}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>

              {/* Left side - Main content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ marginBottom: `${theme.components.gaps.tight}px` }}>
                  <Text variant="body2" style={{ fontWeight: 500, margin: 0 }}>
                    {row[primaryField.key]}
                  </Text>
                </div>
                
                {secondaryField && (
                  <div style={{ marginBottom: `${theme.components.gaps.standard}px` }}>
                    <Text variant="caption" style={{ color: theme.colors.text.secondary, margin: 0 }}>
                      {row[secondaryField.key]}
                    </Text>
                  </div>
                )}

                {/* Additional fields */}
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: `${theme.components.gaps.standard}px`,
                  alignItems: 'center'
                }}>
                  {config.fields
                    .filter(f => f.key !== primaryField.key && f.key !== secondaryField?.key && f.type !== 'actions')
                    .map(field => (
                      <div key={field.key} style={{ display: 'flex', alignItems: 'center', gap: `${theme.components.gaps.tight}px` }}>
                        <Text variant="caption" style={{ 
                          color: theme.colors.text.secondary, 
                          fontWeight: 500,
                          margin: 0
                        }}>
                          {field.label}:
                        </Text>
                        <div>
                          {renderFieldContent(field, row[field.key], row)}
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Right side - Actions */}
              {actionField && (
                <div style={{ flexShrink: 0 }}>
                  {renderFieldContent(actionField, null, row)}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ListLayout;