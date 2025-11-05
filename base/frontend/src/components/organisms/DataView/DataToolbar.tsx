import React from 'react';
import { DataToolbarConfig, FilterConfig, DataViewConfig } from '@/types/components';
import { UseSearchEngineReturn } from '@/hooks/useSearchEngine';
import { useTheme } from '@/hooks';
import Button from '@/components/atoms/Button';
import Input from '@/components/atoms/Input';
import Icon from '@/components/atoms/Icon';

interface DataToolbarProps {
  config: DataToolbarConfig;
  currentChart: DataViewConfig['chart'];
  onChartChange: (chart: DataViewConfig['chart']) => void;
  onRefresh: () => void;
  searchEngine: UseSearchEngineReturn<any>;
  filters?: FilterConfig[];
}

const DataToolbar: React.FC<DataToolbarProps> = ({
  config,
  currentChart,
  onChartChange,
  onRefresh,
  searchEngine,
  filters = []
}) => {
  const { theme } = useTheme();

  const toolbarStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: `${theme.layout.container.gap}px`,
    padding: `${theme.layout.container.padding}px`,
    backgroundColor: theme.colors.background.paper,
    borderRadius: '8px',
    border: `1px solid ${theme.colors.divider}`,
    flexWrap: 'wrap'
  };

  const leftSectionStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: `${theme.components.gaps.standard}px`,
    flex: 1,
    minWidth: '200px'
  };

  const rightSectionStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing.values.sm
  };

  const chartOptions = [
    { value: 'line', label: 'Line', icon: 'trending-up' },
    { value: 'bar', label: 'Bar', icon: 'bar-chart' },
    { value: 'pie', label: 'Pie', icon: 'pie-chart' },
    { value: 'area', label: 'Area', icon: 'activity' },
    { value: 'metrics', label: 'Metrics', icon: 'grid' },
    { value: 'scatter', label: 'Scatter', icon: 'scatter-chart' }
  ];

  return (
    <div style={toolbarStyle}>
      <div style={leftSectionStyle}>
        {config.search && (
          <div style={{ minWidth: '200px' }}>
            <Input
              placeholder="Search data..."
              value={searchEngine.query}
              onChange={(e) => searchEngine.search(e.target.value)}
              startIcon="search"
              size="small"
              fullWidth
            />
          </div>
        )}

        {config.filters && filters.length > 0 && (
          <div style={{ display: 'flex', gap: `${theme.components.gaps.tight}px` }}>
            {/* TODO: Implement filter dropdowns */}
          </div>
        )}
      </div>

      <div style={rightSectionStyle}>
        {config.chartSwitcher && (
          <div style={{ display: 'flex', gap: `${theme.components.gaps.tight}px` }}>
            {chartOptions.map(option => (
              <Button
                key={option.value}
                variant={currentChart === option.value ? 'primary' : 'tertiary'}
                size="small"
                icon={option.icon}
                onClick={() => onChartChange(option.value as DataViewConfig['chart'])}
              >
                {option.label}
              </Button>
            ))}
          </div>
        )}

        {config.refresh && (
          <Button
            variant="secondary"
            size="small"
            icon="refresh-cw"
            onClick={onRefresh}
          >
            Refresh
          </Button>
        )}

        {config.export && (
          <Button
            variant="secondary"
            size="small"
            icon="download"
            onClick={() => console.log('Export chart')}
          >
            Export
          </Button>
        )}
      </div>
    </div>
  );
};

export default DataToolbar;