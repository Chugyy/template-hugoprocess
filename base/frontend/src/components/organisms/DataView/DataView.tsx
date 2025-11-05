import React, { useState } from 'react';
import { DataViewProps } from '@/types/components';
import { useSearchEngine } from '@/hooks/useSearchEngine';
import { useTheme } from '@/hooks';
import DataToolbar from './DataToolbar';
import ChartContainer from './ChartContainer';

const DataView = <T extends Record<string, any>>({
  config,
  data,
  toolbar = {},
  loading = false,
  onChartChange,
  onRefresh,
  className = ''
}: DataViewProps<T>) => {
  const { theme } = useTheme();
  const [currentChart, setCurrentChart] = useState(config.chart);
  
  const searchEngine = useSearchEngine(data, config.searchEngine);

  const handleChartChange = (chart: 'line' | 'bar' | 'pie' | 'area' | 'metrics' | 'scatter') => {
    setCurrentChart(chart);
    onChartChange?.(chart);
  };

  const handleRefresh = () => {
    onRefresh?.();
  };

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing.values.md,
    width: '100%'
  };

  const currentConfig = {
    ...config,
    chart: currentChart
  };

  return (
    <div className={className} style={containerStyle}>
      {(toolbar.search || toolbar.filters || toolbar.chartSwitcher || toolbar.export || toolbar.refresh) && (
        <DataToolbar
          config={toolbar}
          currentChart={currentChart}
          onChartChange={handleChartChange}
          onRefresh={handleRefresh}
          searchEngine={searchEngine}
          filters={[]} // TODO: Add filters support
        />
      )}
      
      <ChartContainer
        config={currentConfig}
        data={searchEngine.data}
        loading={loading}
      />
    </div>
  );
};

export default DataView;