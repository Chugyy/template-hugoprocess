import React, { useMemo } from 'react';
import { ChartProps } from '@/types/components';
import { useTheme } from '@/hooks';
import Text from '@/components/atoms/Text';

const AreaChart = <T extends Record<string, any>>({
  data,
  config,
  width,
  height = 300
}: ChartProps<T>) => {
  const { theme } = useTheme();

  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const { xAxis, yAxis } = config.data;
    
    return data.map(item => ({
      x: item[xAxis],
      values: yAxis.map(field => ({
        field,
        value: Number(item[field]) || 0
      }))
    }));
  }, [data, config.data]);

  const { minValue, maxValue, xLabels } = useMemo(() => {
    if (processedData.length === 0) return { minValue: 0, maxValue: 100, xLabels: [] };

    const allValues = processedData.flatMap(item => 
      item.values.map(v => v.value)
    );
    
    return {
      minValue: Math.min(...allValues, 0),
      maxValue: Math.max(...allValues),
      xLabels: processedData.map(item => item.x)
    };
  }, [processedData]);

  const svgWidth = 800; // Base size for calculations
  const svgHeight = height;
  const padding = 60;
  const chartWidth = svgWidth - padding * 2;
  const chartHeight = svgHeight - padding * 2;

  const getY = (value: number) => {
    const ratio = (value - minValue) / (maxValue - minValue);
    return chartHeight - (ratio * chartHeight) + padding;
  };

  const getX = (index: number) => {
    return (index * chartWidth) / Math.max(processedData.length - 1, 1) + padding;
  };

  const colors = config.colors || [
    theme.colors.primary.main,
    theme.colors.secondary.main,
    theme.colors.success.main,
    theme.colors.warning.main,
    theme.colors.error.main
  ];

  const generateAreaPath = (fieldIndex: number) => {
    const linePoints = processedData.map((item, index) => {
      const x = getX(index);
      const y = getY(item.values[fieldIndex]?.value || 0);
      return { x, y };
    });
    
    if (linePoints.length === 0) return '';

    // Create area path
    const linePath = linePoints.map((point, index) => 
      `${index === 0 ? 'M' : 'L'} ${point.x},${point.y}`
    ).join(' ');

    const baseline = getY(Math.max(minValue, 0));
    
    // Close the area
    const areaPath = `${linePath} L ${linePoints[linePoints.length - 1].x},${baseline} L ${linePoints[0].x},${baseline} Z`;
    
    return areaPath;
  };

  const generateLinePath = (fieldIndex: number) => {
    const points = processedData.map((item, index) => {
      const x = getX(index);
      const y = getY(item.values[fieldIndex]?.value || 0);
      return `${x},${y}`;
    }).join(' L ');
    
    return `M ${points}`;
  };

  return (
    <div style={{ width: '100%', overflow: 'hidden' }}>
      <svg 
        width="100%" 
        height={svgHeight} 
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ display: 'block' }}>
        {/* Gradient definitions */}
        <defs>
          {config.data.yAxis.map((field, index) => (
            <linearGradient
              key={`gradient-${index}`}
              id={`gradient-${index}`}
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop
                offset="0%"
                style={{
                  stopColor: colors[index % colors.length],
                  stopOpacity: 0.6
                }}
              />
              <stop
                offset="100%"
                style={{
                  stopColor: colors[index % colors.length],
                  stopOpacity: 0.1
                }}
              />
            </linearGradient>
          ))}

          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke={theme.colors.divider}
              strokeWidth="1"
              opacity="0.3"
            />
          </pattern>
        </defs>
        
        <rect
          x={padding}
          y={padding}
          width={chartWidth}
          height={chartHeight}
          fill="url(#grid)"
        />

        {/* Y axis */}
        <line
          x1={padding}
          y1={padding}
          x2={padding}
          y2={padding + chartHeight}
          stroke={theme.colors.divider}
          strokeWidth={2}
        />

        {/* X axis */}
        <line
          x1={padding}
          y1={padding + chartHeight}
          x2={padding + chartWidth}
          y2={padding + chartHeight}
          stroke={theme.colors.divider}
          strokeWidth={2}
        />

        {/* Y axis labels */}
        {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
          const value = minValue + (maxValue - minValue) * ratio;
          const y = getY(value);
          
          return (
            <g key={ratio}>
              <text
                x={padding - 10}
                y={y + 4}
                textAnchor="end"
                fontSize="12"
                fill={theme.colors.text.secondary}
              >
                {value.toFixed(0)}
              </text>
            </g>
          );
        })}

        {/* X axis labels */}
        {xLabels.map((label, index) => {
          const x = getX(index);
          return (
            <text
              key={index}
              x={x}
              y={padding + chartHeight + 20}
              textAnchor="middle"
              fontSize="12"
              fill={theme.colors.text.secondary}
            >
              {String(label).length > 10 ? String(label).substring(0, 10) + '...' : label}
            </text>
          );
        })}

        {/* Areas */}
        {config.data.yAxis.map((field, fieldIndex) => (
          <path
            key={`area-${field}`}
            d={generateAreaPath(fieldIndex)}
            fill={`url(#gradient-${fieldIndex})`}
            stroke="none"
          />
        ))}

        {/* Lines */}
        {config.data.yAxis.map((field, fieldIndex) => (
          <path
            key={`line-${field}`}
            d={generateLinePath(fieldIndex)}
            fill="none"
            stroke={colors[fieldIndex % colors.length]}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}

        {/* Data points */}
        {processedData.map((item, dataIndex) => 
          item.values.map((valueObj, fieldIndex) => {
            const x = getX(dataIndex);
            const y = getY(valueObj.value);
            
            return (
              <circle
                key={`${dataIndex}-${fieldIndex}`}
                cx={x}
                cy={y}
                r={3}
                fill={colors[fieldIndex % colors.length]}
                stroke={theme.colors.background.paper}
                strokeWidth={2}
              />
            );
          })
        )}
      </svg>

      {/* Legend */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: theme.spacing.values.md,
        marginTop: theme.spacing.values.sm,
        flexWrap: 'wrap'
      }}>
        {config.data.yAxis.map((field, index) => (
          <div
            key={field}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.values.xs
            }}
          >
            <div
              style={{
                width: '12px',
                height: '12px',
                backgroundColor: colors[index % colors.length],
                borderRadius: '50%'
              }}
            />
            <Text variant="caption" style={{ margin: 0 }}>
              {field}
            </Text>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AreaChart;