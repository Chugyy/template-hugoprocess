import React from 'react';
import { DataViewConfig } from '@/types/components';
import { useTheme } from '@/hooks';
import LineChart from './charts/LineChart';
import BarChart from './charts/BarChart';
import PieChart from './charts/PieChart';
import AreaChart from './charts/AreaChart';
import MetricsCard from './charts/MetricsCard';
import ScatterChart from './charts/ScatterChart';
import Icon from '@/components/atoms/Icon';
import Text from '@/components/atoms/Text';

interface ChartContainerProps<T = any> {
  config: DataViewConfig<T>;
  data: T[];
  loading?: boolean;
}

const ChartContainer = <T extends Record<string, any>>({
  config,
  data,
  loading = false
}: ChartContainerProps<T>) => {
  const { theme } = useTheme();

  const containerStyle: React.CSSProperties = {
    backgroundColor: theme.colors.background.paper,
    borderRadius: '8px',
    border: `1px solid ${theme.colors.divider}`,
    padding: theme.spacing.values.md,
    minHeight: config.height || 400,
    position: 'relative'
  };

  const headerStyle: React.CSSProperties = {
    marginBottom: theme.spacing.values.md,
    paddingBottom: theme.spacing.values.sm,
    borderBottom: `1px solid ${theme.colors.divider}`
  };

  if (loading) {
    return (
      <div style={{
        ...containerStyle,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        gap: theme.spacing.values.sm
      }}>
        <Icon name="loader" size={32} />
        <Text variant="body2">Loading chart data...</Text>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div style={{
        ...containerStyle,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        gap: theme.spacing.values.sm,
        textAlign: 'center'
      }}>
        <Icon name="bar-chart" size={48} style={{ color: theme.colors.text.disabled }} />
        <Text variant="h3" style={{ marginBottom: theme.spacing.values.xs }}>
          No data available
        </Text>
        <Text variant="body2" style={{ color: theme.colors.text.secondary }}>
          There's no data to display in the chart
        </Text>
      </div>
    );
  }

  const renderChart = () => {
    const chartProps = {
      data,
      config,
      width: config.responsive ? undefined : 800,
      height: config.height || 400
    };

    switch (config.chart) {
      case 'line':
        return <LineChart {...chartProps} />;
      case 'bar':
        return <BarChart {...chartProps} />;
      case 'pie':
        return <PieChart {...chartProps} />;
      case 'area':
        return <AreaChart {...chartProps} />;
      case 'metrics':
        return <MetricsCard {...chartProps} />;
      case 'scatter':
        return <ScatterChart {...chartProps} />;
      default:
        return <LineChart {...chartProps} />;
    }
  };

  return (
    <div style={containerStyle}>
      {config.title && (
        <div style={headerStyle}>
          <Text variant="h2" style={{ margin: 0 }}>
            {config.title}
          </Text>
        </div>
      )}
      
      {renderChart()}
    </div>
  );
};

export default ChartContainer;