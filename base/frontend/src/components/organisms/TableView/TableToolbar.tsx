import React from 'react';
import { TableToolbarConfig, FilterConfig } from '@/types/components';
import { useTheme } from '@/hooks';
import Button from '@/components/atoms/Button';
import Input from '@/components/atoms/Input';
import Icon from '@/components/atoms/Icon';
import Text from '@/components/atoms/Text';
import SubModal from '@/components/molecules/SubModal';
import Select from '@/components/atoms/Select';

import { UseSearchEngineReturn } from '@/hooks/useSearchEngine';

interface TableToolbarProps {
  config: TableToolbarConfig;
  currentLayout: 'table' | 'kanban' | 'list';
  onLayoutChange: (layout: 'table' | 'kanban' | 'list') => void;
  searchEngine: UseSearchEngineReturn<any>;
  filters?: FilterConfig[];
  selectedCount?: number;
  fields?: any[];
  groupBy?: string;
  onGroupByChange?: (groupBy: string) => void;
}

const TableToolbar: React.FC<TableToolbarProps> = ({
  config,
  currentLayout,
  onLayoutChange,
  searchEngine,
  filters = [],
  selectedCount = 0,
  fields = [],
  groupBy,
  onGroupByChange
}) => {
  const { theme } = useTheme();

  // Filtres prédéfinis pour les champs communs
  const commonFilters = [
    {
      key: 'status',
      label: 'Status',
      type: 'select' as const,
      options: [
        { value: 'Active', label: 'Active' },
        { value: 'Inactive', label: 'Inactive' }
      ]
    },
    {
      key: 'role', 
      label: 'Role',
      type: 'select' as const,
      options: [
        { value: 'Admin', label: 'Administrator' },
        { value: 'User', label: 'User' },
        { value: 'Moderator', label: 'Moderator' }
      ]
    },
    {
      key: 'verified',
      label: 'Verified',
      type: 'select' as const, 
      options: [
        { value: 'true', label: 'Verified' },
        { value: 'false', label: 'Not Verified' }
      ]
    },
    {
      key: 'createdAt',
      label: 'Date Created',
      type: 'select' as const,
      options: [
        { value: 'last7days', label: 'Last 7 days' },
        { value: 'last30days', label: 'Last 30 days' },
        { value: 'last90days', label: 'Last 90 days' }
      ]
    }
  ];

  const availableFilters = filters.length > 0 ? filters : commonFilters;
  const dropdownFields = fields.filter((f: any) => f.type === 'dropdown' || f.type === 'tag' || f.type === 'select');

  const toolbarStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: `${theme.layout.container.gap}px`,
    padding: `${theme.layout.container.padding}px`,
    backgroundColor: theme.colors.background.paper,
    borderRadius: '8px',
    border: `1px solid ${theme.colors.divider}`
  };

  const leftSectionStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: `${theme.components.gaps.standard}px`,
    flex: 1
  };

  const rightSectionStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing.values.sm
  };

  const ViewSwitcher = () => (
    <div style={{ display: 'flex', gap: '2px', border: `1px solid ${theme.colors.divider}`, borderRadius: `${theme.components.borderRadius.medium}px`, overflow: 'hidden' }}>
      {(['table', 'kanban', 'list'] as const).map(layout => (
        <Button
          key={layout}
          variant={currentLayout === layout ? 'primary' : 'tertiary'}
          size="small"
          icon={layout === 'table' ? 'table' : layout === 'kanban' ? 'columns' : 'list'}
          onClick={() => onLayoutChange(layout)}
          style={{
            borderRadius: '0',
            border: 'none',
            minHeight: `${theme.components.heights.small}px`
          }}
        />
      ))}
    </div>
  );

  const FilterDropdown = () => {
    // Organiser les filtres en catégories
    const generalFilters = availableFilters.filter(f => ['status', 'role'].includes(f.key));
    const dateFilters = availableFilters.filter(f => f.key === 'createdAt');
    const verificationFilters = availableFilters.filter(f => f.key === 'verified');
    
    const categories = [
      {
        key: 'general',
        label: 'General',
        children: (
          <div style={{ display: 'flex', flexDirection: 'column', gap: `${theme.components.gaps.standard}px` }}>
            {generalFilters.map(filter => (
              <div key={filter.key}>
                <Text variant="caption" style={{ 
                  fontWeight: 500, 
                  color: theme.colors.text.secondary,
                  marginBottom: `${theme.components.gaps.tight}px`,
                  display: 'block'
                }}>
                  {filter.label}
                </Text>
                <Select
                  value={searchEngine.filters[filter.key] || ''}
                  options={[
                    { value: '', label: 'All' },
                    ...(filter.options?.map(option => ({
                      value: option.value,
                      label: option.label
                    })) || [])
                  ]}
                  onChange={(value) => searchEngine.filter(filter.key, value || undefined)}
                  size="small"
                  fullWidth
                />
              </div>
            ))}
          </div>
        )
      },
      // Ajouter la section Group By pour Kanban
      ...(currentLayout === 'kanban' && dropdownFields.length > 0 && onGroupByChange ? [{
        key: 'grouping',
        label: 'Grouping',
        children: (
          <div style={{ display: 'flex', flexDirection: 'column', gap: `${theme.components.gaps.standard}px` }}>
            <div>
              <Text variant="caption" style={{ 
                fontWeight: 500, 
                color: theme.colors.text.secondary,
                marginBottom: `${theme.components.gaps.tight}px`,
                display: 'block'
              }}>
                Group by
              </Text>
              <Select
                value={groupBy || dropdownFields[0]?.key || ''}
                options={dropdownFields.map(field => ({
                  value: field.key,
                  label: field.label
                }))}
                onChange={(value) => onGroupByChange(value)}
                size="small"
                fullWidth
              />
            </div>
          </div>
        )
      }] : []),
      {
        key: 'dates',
        label: 'Dates',
        children: (
          <div style={{ display: 'flex', flexDirection: 'column', gap: `${theme.components.gaps.standard}px` }}>
            {dateFilters.map(filter => (
              <div key={filter.key}>
                <Text variant="caption" style={{ 
                  fontWeight: 500, 
                  color: theme.colors.text.secondary,
                  marginBottom: `${theme.components.gaps.tight}px`,
                  display: 'block'
                }}>
                  {filter.label}
                </Text>
                <Select
                  value={searchEngine.filters[filter.key] || ''}
                  options={[
                    { value: '', label: 'All time' },
                    ...(filter.options?.map(option => ({
                      value: option.value,
                      label: option.label
                    })) || [])
                  ]}
                  onChange={(value) => searchEngine.filter(filter.key, value || undefined)}
                  size="small"
                  fullWidth
                />
              </div>
            ))}
          </div>
        )
      },
      {
        key: 'verification',
        label: 'Status',
        children: (
          <div style={{ display: 'flex', flexDirection: 'column', gap: `${theme.components.gaps.standard}px` }}>
            {verificationFilters.map(filter => (
              <div key={filter.key}>
                <Text variant="caption" style={{ 
                  fontWeight: 500, 
                  color: theme.colors.text.secondary,
                  marginBottom: `${theme.components.gaps.tight}px`,
                  display: 'block'
                }}>
                  {filter.label}
                </Text>
                <Select
                  value={searchEngine.filters[filter.key] || ''}
                  options={[
                    { value: '', label: 'All' },
                    ...(filter.options?.map(option => ({
                      value: option.value,
                      label: option.label
                    })) || [])
                  ]}
                  onChange={(value) => searchEngine.filter(filter.key, value || undefined)}
                  size="small"
                  fullWidth
                />
              </div>
            ))}
          </div>
        )
      }
    ];

    return (
      <SubModal
        title="Filters"
        categories={categories}
        placement="bottom-start"
        width="360px"
        footer={
          <Button 
            variant="tertiary" 
            size="small" 
            onClick={searchEngine.clearAllFilters}
            fullWidth
          >
            Clear All Filters
          </Button>
        }
        trigger={
          <Button 
            variant="tertiary" 
            size="small" 
            icon="filter"
            tag={Object.keys(searchEngine.filters).length > 0 ? {
              label: String(Object.keys(searchEngine.filters).length),
              color: 'primary',
              variant: 'filled'
            } : undefined}
          >
            Filters
          </Button>
        }
      />
    );
  };

  return (
    <div style={toolbarStyle}>
      <div style={leftSectionStyle}>
        {config.search && (
          <div style={{ minWidth: '250px' }}>
            <Input
              placeholder="Search..."
              value={searchEngine.query}
              onChange={(e) => searchEngine.search(e.target.value)}
              startIcon="search"
              size="small"
              fullWidth
            />
          </div>
        )}
        
        {config.filters && <FilterDropdown />}
        
        {selectedCount > 0 && (
          <span style={{ 
            fontSize: '0.875rem', 
            color: theme.colors.text.secondary 
          }}>
            {selectedCount} selected
          </span>
        )}
      </div>

      <div style={rightSectionStyle}>
        {config.export && (
          <Button variant="tertiary" size="small" icon="download">
            Export
          </Button>
        )}
        
        {config.viewSwitcher && <ViewSwitcher />}
      </div>
    </div>
  );
};

export default TableToolbar;