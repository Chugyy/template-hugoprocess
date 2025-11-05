import React, { useMemo } from 'react';
import { ChartProps, MetricConfig } from '@/types/components';
import { useTheme } from '@/hooks';
import Text from '@/components/atoms/Text';
import Icon from '@/components/atoms/Icon';

const MetricsCard = <T extends Record<string, any>>({
  data,
  config,
  width,
  height = 300
}: ChartProps<T>) => {
  const { theme } = useTheme();

  const metrics = useMemo(() => {
    if (!data || data.length === 0) return [];

    const { yAxis, aggregation = 'sum' } = config.data;

    return yAxis.map(field => {
      const values = data.map(item => Number(item[field]) || 0);
      let value: number;
      
      switch (aggregation) {
        case 'avg':
          value = values.reduce((sum, v) => sum + v, 0) / values.length;
          break;
        case 'count':
          value = data.length;
          break;
        case 'min':
          value = Math.min(...values);
          break;
        case 'max':
          value = Math.max(...values);
          break;
        case 'sum':
        default:
          value = values.reduce((sum, v) => sum + v, 0);
      }

      // Calculate trend (simple comparison with previous values)
      const mid = Math.floor(values.length / 2);
      const firstHalf = values.slice(0, mid);
      const secondHalf = values.slice(mid);
      
      const firstHalfAvg = firstHalf.length > 0 ? firstHalf.reduce((sum, v) => sum + v, 0) / firstHalf.length : 0;
      const secondHalfAvg = secondHalf.length > 0 ? secondHalf.reduce((sum, v) => sum + v, 0) / secondHalf.length : 0;
      
      const trend = secondHalfAvg - firstHalfAvg;
      const trendPercentage = firstHalfAvg !== 0 ? (trend / firstHalfAvg) * 100 : 0;

      return {
        key: field,
        label: field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, ' '),
        value,
        format: 'number' as const,
        color: 'primary',
        trend: {
          value: Math.abs(trendPercentage),
          direction: trend >= 0 ? 'up' as const : 'down' as const,
          period: 'vs previous period'
        }
      };
    });
  }, [data, config.data]);

  const formatValue = (metric: MetricConfig) => {
    const value = typeof metric.value === 'number' ? metric.value : 0;
    
    switch (metric.format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(value);
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'number':
      default:
        return new Intl.NumberFormat('en-US').format(value);
    }
  };

  const getMetricIcon = (field: string) => {
    if (field.includes('user')) return 'users';
    if (field.includes('revenue') || field.includes('price') || field.includes('cost')) return 'dollar-sign';
    if (field.includes('order') || field.includes('sale')) return 'shopping-cart';
    if (field.includes('view') || field.includes('click')) return 'eye';
    if (field.includes('conversion')) return 'trending-up';
    return 'bar-chart-2';
  };

  const getMetricColor = (index: number) => {
    const colors = [
      theme.colors.primary.main,
      theme.colors.secondary.main,
      theme.colors.success.main,
      theme.colors.warning.main,
      theme.colors.error.main,
      theme.colors.info.main
    ];
    return colors[index % colors.length];
  };

  if (metrics.length === 0) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height,
        flexDirection: 'column',
        gap: theme.spacing.values.sm
      }}>
        <Text variant="body2" style={{ color: theme.colors.text.secondary }}>
          No metrics available
        </Text>
      </div>
    );
  }

  const gridCols = metrics.length <= 2 ? metrics.length : metrics.length <= 4 ? 2 : 3;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
      gap: theme.spacing.values.md,
      width: '100%'
    }}>
      {metrics.map((metric, index) => {
        const color = getMetricColor(index);
        
        return (
          <div
            key={metric.key}
            style={{
              backgroundColor: theme.colors.background.default,
              border: `1px solid ${theme.colors.divider}`,
              borderRadius: '8px',
              padding: theme.spacing.values.md,
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Background decoration */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '4px',
                height: '100%',
                backgroundColor: color,
              }}
            />

            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: theme.spacing.values.sm
            }}>
              <div style={{ flex: 1 }}>
                <Text variant="caption" style={{
                  color: theme.colors.text.secondary,
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  letterSpacing: '0.5px',
                  margin: 0
                }}>
                  {metric.label}
                </Text>
              </div>
              
              <div style={{
                backgroundColor: color + '20',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Icon 
                  name={getMetricIcon(metric.key)} 
                  size={16} 
                  style={{ color }} 
                />
              </div>
            </div>

            {/* Value */}
            <div style={{ marginBottom: theme.spacing.values.sm }}>
              <Text variant="h1" style={{
                fontSize: '2rem',
                fontWeight: 700,
                color: theme.colors.text.primary,
                margin: 0,
                lineHeight: 1
              }}>
                {formatValue(metric)}
              </Text>
            </div>

            {/* Trend */}
            {metric.trend && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.values.xs
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px',
                  color: metric.trend.direction === 'up' 
                    ? theme.colors.success.main 
                    : theme.colors.error.main
                }}>
                  <Icon 
                    name={metric.trend.direction === 'up' ? 'trending-up' : 'trending-down'} 
                    size={12} 
                  />
                  <Text variant="caption" style={{
                    fontWeight: 600,
                    margin: 0,
                    color: 'inherit'
                  }}>
                    {metric.trend.value.toFixed(1)}%
                  </Text>
                </div>
                
                <Text variant="caption" style={{
                  color: theme.colors.text.secondary,
                  margin: 0
                }}>
                  {metric.trend.period}
                </Text>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default MetricsCard;