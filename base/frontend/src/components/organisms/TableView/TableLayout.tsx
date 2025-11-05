import React from 'react';
import { TableViewConfig, FieldConfig } from '@/types/components';
import { UseSearchEngineReturn } from '@/hooks/useSearchEngine';
import { useTheme } from '@/hooks';
import Text from '@/components/atoms/Text';
import Tag from '@/components/atoms/Tag';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';

interface TableLayoutProps<T = any> {
  config: TableViewConfig<T>;
  data: T[];
  totalCount: number;
  loading: boolean;
  searchEngine: UseSearchEngineReturn<T>;
  selectedIds?: Set<string>;
  onSelectionChange?: (selectedIds: Set<string>) => void;
  onRowAction?: (action: string, row: T) => void;
}

const TableLayout = <T extends Record<string, any>>({
  config,
  data,
  loading,
  searchEngine,
  selectedIds = new Set(),
  onSelectionChange,
  onRowAction
}: TableLayoutProps<T>) => {
  const { theme } = useTheme();

  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    backgroundColor: theme.colors.background.paper,
    borderRadius: '8px',
    overflow: 'hidden',
    border: `1px solid ${theme.colors.divider}`
  };

  const headerStyle: React.CSSProperties = {
    backgroundColor: theme.colors.action.hover,
    borderBottom: `1px solid ${theme.colors.divider}`
  };

  const cellStyle: React.CSSProperties = {
    padding: `${theme.components.gaps.standard}px`,
    textAlign: 'left',
    borderBottom: `1px solid ${theme.colors.divider}`,
    verticalAlign: 'middle'
  };

  const renderCellContent = (field: FieldConfig, value: any, row: T) => {
    if (field.render) {
      return field.render(value, row);
    }

    switch (field.type) {
      case 'tag':
      case 'dropdown':
        return (
          <Tag
            label={value}
            variant="status"
            color={value === 'Active' ? 'success' : value === 'Inactive' ? 'error' : 'primary'}
            size="small"
          />
        );
      case 'checkbox':
      case 'boolean':
        return (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <input
              type="checkbox"
              checked={Boolean(value)}
              disabled
              style={{ 
                cursor: 'not-allowed',
                width: '18px',
                height: '18px'
              }}
            />
          </div>
        );
      case 'actions':
        return (
          <div style={{ 
            display: 'flex', 
            gap: `${theme.components.gaps.tight}px`,
            justifyContent: 'flex-start',
            alignItems: 'center',
            flexWrap: 'nowrap',
            width: '100%',
            minWidth: 'max-content',
            backgroundColor: 'transparent'
          }}>
            {config.actions?.map(action => (
              <Button
                key={action.key}
                variant={action.variant || 'tertiary'}
                size="small"
                icon={action.icon}
                onClick={() => action.onClick(row)}
              >
                {action.label}
              </Button>
            ))}
            <Button
              variant="primary"
              size="small"
              icon="edit"
              onClick={() => onRowAction?.('edit', row)}
            >
              Edit
            </Button>
            <Button
              variant="danger"
              size="small"
              icon="trash"
              onClick={() => onRowAction?.('delete', row)}
            >
              Delete
            </Button>
            <Button
              variant="tertiary"
              size="small"
              icon="copy"
              onClick={() => onRowAction?.('duplicate', row)}
            >
              Duplicate
            </Button>
          </div>
        );
      case 'number':
        return <Text variant="body2">{typeof value === 'number' ? value.toLocaleString() : value}</Text>;
      case 'date':
        return <Text variant="body2">{value instanceof Date ? value.toLocaleDateString() : value}</Text>;
      default:
        return <Text variant="body2">{value}</Text>;
    }
  };

  const handleSort = (field: FieldConfig) => {
    if (field.sortable) {
      searchEngine.sort(field.key);
    }
  };

  const getSortIcon = (field: FieldConfig) => {
    if (!field.sortable) return null;
    
    const currentSort = searchEngine.sort;
    if (currentSort?.field !== field.key) {
      return <Icon name="chevron-up-down" size={12} />;
    }
    
    return (
      <Icon 
        name={currentSort.direction === 'asc' ? 'chevron-up' : 'chevron-down'} 
        size={12} 
      />
    );
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: `${theme.layout.container.padding * 2}px`,
        backgroundColor: theme.colors.background.paper,
        borderRadius: '8px',
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
        borderRadius: '8px',
        border: `1px solid ${theme.colors.divider}`,
        textAlign: 'center'
      }}>
        <Icon name="table" size={48} style={{ color: theme.colors.text.disabled, marginBottom: `${theme.layout.container.gap}px` }} />
        <Text variant="h3" style={{ marginBottom: `${theme.components.gaps.standard}px` }}>
          No data found
        </Text>
        <Text variant="body2" style={{ color: theme.colors.text.secondary }}>
          {searchEngine.query || Object.keys(searchEngine.filters).length > 0 
            ? 'Try adjusting your search or filters'
            : 'No data available to display'
          }
        </Text>
      </div>
    );
  }

  const handleSelectAll = () => {
    if (!onSelectionChange) return;
    if (selectedIds.size === data.length) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(data.map(item => item.id || String(item))));
    }
  };

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

  // Advanced column width system (migrated from Table component)
  const getColumnWidth = (field: FieldConfig) => {
    const defaultSizing = { minWidth: 80, maxWidth: 250 };
    const { minWidth = 80, maxWidth = 250 } = {
      ...defaultSizing,
      ...field.sizing
    };
    
    if (field.sizing?.autoSize === false) {
      return `${minWidth}px`;
    }
    
    const headerWidth = field.label.length * 8 + 32;
    
    const maxContentWidth = data.reduce((max, row) => {
      const value = String(row[field.key] || '');
      let estimatedWidth = value.length * 8 + 32;
      
      switch (field.type) {
        case 'input':
        case 'date':
        case 'number':
          estimatedWidth = Math.max(estimatedWidth, 120);
          break;
        case 'select':
          estimatedWidth = Math.max(estimatedWidth, 100);
          break;
        case 'button':
          estimatedWidth = Math.max(estimatedWidth, 80);
          break;
        case 'actions':
          const buttonCount = (config.actions?.length || 0) + 3; // +3 for Edit/Delete/Duplicate
          estimatedWidth = buttonCount * 80 + (buttonCount - 1) * 8 + 32;
          break;
        case 'checkbox':
          estimatedWidth = 48;
          break;
        case 'tag':
          estimatedWidth = Math.max(estimatedWidth, 80);
          break;
      }
      
      return Math.max(max, estimatedWidth);
    }, headerWidth);
    
    const finalWidth = Math.min(Math.max(maxContentWidth, minWidth), maxWidth);
    return `${finalWidth}px`;
  };
  
  const baseColumns = config.fields
    .map(field => getColumnWidth(field))
    .join(' ');
  const gridColumns = `48px ${baseColumns}`; // Always include checkbox column

  // Calculate total minimum width needed with proper button sizing
  const totalMinWidth = config.fields.reduce((total, field) => {
    if (field.type === 'actions') {
      // Mesure réelle des boutons avec margin/padding + marge de sécurité
      const buttonCount = (config.actions?.length || 0) + 3;
      const realButtonWidth = buttonCount * 100 + (buttonCount - 1) * 8 + 60; // Plus généreux
      return total + realButtonWidth;
    }
    const width = getColumnWidth(field);
    const numericWidth = parseInt(width.replace('px', ''));
    return total + numericWidth;
  }, 48); // + checkbox column width

  return (
    <div style={{
      backgroundColor: theme.colors.background.paper,
      borderRadius: '8px',
      border: `1px solid ${theme.colors.divider}`,
      overflow: 'hidden'
    }}>
      <div style={{
        overflowX: 'auto',
        overflowY: 'visible',
        width: '100%',
        position: 'relative'
      }}>
        <div style={{ 
          minWidth: `${totalMinWidth}px`,
          width: '100%'
        }}>
          {/* Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: gridColumns,
            gap: `${theme.components.gaps.standard}px`,
            padding: `${theme.components.gaps.standard}px`,
            backgroundColor: theme.colors.action.hover,
            borderBottom: `1px solid ${theme.colors.divider}`,
            width: '100%',
            minWidth: `${totalMinWidth}px`
          }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <input
            type="checkbox"
            checked={selectedIds.size === data.length && data.length > 0}
            onChange={handleSelectAll}
            style={{ cursor: 'pointer' }}
          />
        </div>
        {config.fields.map(field => (
          <div
            key={field.key}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: `${theme.components.gaps.tight}px`,
              cursor: field.sortable ? 'pointer' : 'default'
            }}
            onClick={() => handleSort(field)}
          >
            <Text variant="overline" style={{ margin: 0, fontWeight: 600 }}>
              {field.label}
            </Text>
            {getSortIcon(field)}
          </div>
        ))}
      </div>

      {/* Rows */}
      {data.map((row, index) => {
        const itemId = row.id || String(row);
        const isSelected = selectedIds.has(itemId);
        
        return (
          <div
            key={itemId}
            style={{
              display: 'grid',
              gridTemplateColumns: gridColumns,
              gap: `${theme.components.gaps.standard}px`,
              padding: `${theme.components.gaps.standard}px`,
              borderBottom: index < data.length - 1 ? `1px solid ${theme.colors.divider}` : 'none',
              alignItems: 'center',
              transition: 'background-color 0.2s',
              backgroundColor: isSelected ? theme.colors.action.selected || theme.colors.primary.light : 'transparent',
              cursor: 'pointer',
              width: '100%',
              minWidth: `${totalMinWidth}px`,
              position: 'relative'
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => handleSelectItem(itemId)}
                style={{ cursor: 'pointer' }}
              />
            </div>
            {config.fields.map(field => (
              <div 
                key={field.key} 
                style={{ 
                  minWidth: field.type === 'actions' ? getColumnWidth(field).replace('px', '') + 'px' : 0,
                  maxWidth: field.type === 'actions' ? getColumnWidth(field) : '100%',
                  width: field.type === 'actions' ? getColumnWidth(field) : 'auto',
                  overflow: field.type === 'actions' ? 'visible' : 'hidden',
                  textOverflow: field.type === 'actions' ? 'clip' : 'ellipsis',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: field.type === 'actions' ? 'flex-start' : 'flex-start'
                }}
              >
                {renderCellContent(field, row[field.key], row)}
              </div>
            ))}
          </div>
        );
      })}
        </div>
      </div>
    </div>
  );
};

export default TableLayout;