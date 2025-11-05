import React, { useMemo } from 'react';
import { ChartProps } from '@/types/components';
import { useTheme } from '@/hooks';
import Text from '@/components/atoms/Text';

const ScatterChart = <T extends Record<string, any>>({
  data,
  config,
  width,
  height = 300
}: ChartProps<T>) => {
  const { theme } = useTheme();

  const processedData = useMemo(() => {
    if (!data || data.length === 0 || config.data.yAxis.length < 2) return [];

    const { xAxis, yAxis } = config.data;
    const xField = xAxis;
    const yField = yAxis[0];
    const sizeField = yAxis[1]; // Optional size field
    
    return data.map(item => ({
      x: Number(item[xField]) || 0,
      y: Number(item[yField]) || 0,
      size: sizeField ? Number(item[sizeField]) || 5 : 5,
      label: item[xAxis] || 'Point'
    }));
  }, [data, config.data]);

  const { minX, maxX, minY, maxY, minSize, maxSize } = useMemo(() => {
    if (processedData.length === 0) return { 
      minX: 0, maxX: 100, minY: 0, maxY: 100, minSize: 5, maxSize: 15 
    };

    const xValues = processedData.map(item => item.x);
    const yValues = processedData.map(item => item.y);
    const sizeValues = processedData.map(item => item.size);
    
    return {
      minX: Math.min(...xValues),
      maxX: Math.max(...xValues),
      minY: Math.min(...yValues),
      maxY: Math.max(...yValues),
      minSize: Math.min(...sizeValues),
      maxSize: Math.max(...sizeValues)
    };
  }, [processedData]);

  const svgWidth = 800; // Base size for calculations
  const svgHeight = height;
  const padding = 60;
  const chartWidth = svgWidth - padding * 2;
  const chartHeight = svgHeight - padding * 2;

  const getX = (value: number) => {
    if (maxX === minX) return padding + chartWidth / 2;
    return padding + ((value - minX) / (maxX - minX)) * chartWidth;
  };

  const getY = (value: number) => {
    if (maxY === minY) return padding + chartHeight / 2;
    return padding + chartHeight - ((value - minY) / (maxY - minY)) * chartHeight;
  };

  const getPointSize = (size: number) => {
    if (maxSize === minSize) return 6;
    const normalizedSize = (size - minSize) / (maxSize - minSize);
    return 4 + normalizedSize * 12; // Range from 4 to 16px
  };

  const colors = config.colors || [theme.colors.primary.main];

  return (
    <div style={{ width: '100%', overflow: 'hidden' }}>
      <svg 
        width="100%" 
        height={svgHeight} 
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ display: 'block' }}>
        {/* Grid lines */}
        <defs>
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
          const value = minY + (maxY - minY) * ratio;
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
                {value.toFixed(1)}
              </text>
            </g>
          );
        })}

        {/* X axis labels */}
        {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
          const value = minX + (maxX - minX) * ratio;
          const x = getX(value);
          
          return (
            <text
              key={ratio}
              x={x}
              y={padding + chartHeight + 20}
              textAnchor="middle"
              fontSize="12"
              fill={theme.colors.text.secondary}
            >
              {value.toFixed(1)}
            </text>
          );
        })}

        {/* Scatter points */}
        {processedData.map((point, index) => {
          const x = getX(point.x);
          const y = getY(point.y);
          const pointSize = getPointSize(point.size);
          const color = colors[index % colors.length];
          
          return (
            <g key={index}>
              <circle
                cx={x}
                cy={y}
                r={pointSize}
                fill={color + '80'}
                stroke={color}
                strokeWidth={2}
                style={{ cursor: 'pointer' }}
              />
              
              {/* Hover tooltip area (invisible) */}
              <circle
                cx={x}
                cy={y}
                r={Math.max(pointSize + 5, 15)}
                fill="transparent"
                style={{ cursor: 'pointer' }}
              >
                <title>
                  {`${point.label}: (${point.x}, ${point.y})${point.size !== 5 ? `, size: ${point.size}` : ''}`}
                </title>
              </circle>
            </g>
          );
        })}
      </svg>

      {/* Axis labels */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: theme.spacing.values.lg,
        marginTop: theme.spacing.values.sm
      }}>
        <Text variant="caption" style={{ 
          color: theme.colors.text.secondary,
          fontWeight: 500,
          margin: 0 
        }}>
          X: {config.data.xAxis}
        </Text>
        <Text variant="caption" style={{ 
          color: theme.colors.text.secondary,
          fontWeight: 500,
          margin: 0 
        }}>
          Y: {config.data.yAxis[0]}
        </Text>
        {config.data.yAxis[1] && (
          <Text variant="caption" style={{ 
            color: theme.colors.text.secondary,
            fontWeight: 500,
            margin: 0 
          }}>
            Size: {config.data.yAxis[1]}
          </Text>
        )}
      </div>

      {/* Statistics */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: theme.spacing.values.md,
        marginTop: theme.spacing.values.sm,
        padding: theme.spacing.values.sm,
        backgroundColor: theme.colors.background.default,
        borderRadius: '4px',
        border: `1px solid ${theme.colors.divider}`
      }}>
        <div style={{ textAlign: 'center' }}>
          <Text variant="caption" style={{ 
            color: theme.colors.text.secondary,
            display: 'block',
            margin: 0,
            marginBottom: '2px'
          }}>
            Points
          </Text>
          <Text variant="body2" style={{ fontWeight: 600, margin: 0 }}>
            {processedData.length}
          </Text>
        </div>
        
        <div style={{ textAlign: 'center' }}>
          <Text variant="caption" style={{ 
            color: theme.colors.text.secondary,
            display: 'block',
            margin: 0,
            marginBottom: '2px'
          }}>
            X Range
          </Text>
          <Text variant="body2" style={{ fontWeight: 600, margin: 0 }}>
            {minX.toFixed(1)} - {maxX.toFixed(1)}
          </Text>
        </div>
        
        <div style={{ textAlign: 'center' }}>
          <Text variant="caption" style={{ 
            color: theme.colors.text.secondary,
            display: 'block',
            margin: 0,
            marginBottom: '2px'
          }}>
            Y Range
          </Text>
          <Text variant="body2" style={{ fontWeight: 600, margin: 0 }}>
            {minY.toFixed(1)} - {maxY.toFixed(1)}
          </Text>
        </div>
      </div>
    </div>
  );
};

export default ScatterChart;