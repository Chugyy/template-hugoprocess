import React, { useMemo } from 'react';
import { ChartProps } from '@/types/components';
import { useTheme } from '@/hooks';
import Text from '@/components/atoms/Text';

const BarChart = <T extends Record<string, any>>({
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

  const { maxValue, xLabels } = useMemo(() => {
    if (processedData.length === 0) return { maxValue: 100, xLabels: [] };

    const allValues = processedData.flatMap(item => 
      item.values.map(v => v.value)
    );
    
    return {
      maxValue: Math.max(...allValues, 10),
      xLabels: processedData.map(item => item.x)
    };
  }, [processedData]);

  const svgWidth = 800; // Base size for calculations
  const svgHeight = height;
  const padding = 60;
  const chartWidth = svgWidth - padding * 2;
  const chartHeight = svgHeight - padding * 2;

  const barGroupWidth = chartWidth / processedData.length;
  const barWidth = Math.min(barGroupWidth / config.data.yAxis.length - 4, 40);

  const getBarHeight = (value: number) => {
    return (value / maxValue) * chartHeight;
  };

  const getBarX = (groupIndex: number, barIndex: number) => {
    const groupStart = padding + (groupIndex * barGroupWidth);
    const groupCenter = groupStart + barGroupWidth / 2;
    const totalBarsWidth = config.data.yAxis.length * barWidth + (config.data.yAxis.length - 1) * 2;
    const barsStart = groupCenter - totalBarsWidth / 2;
    return barsStart + barIndex * (barWidth + 2);
  };

  const colors = config.colors || [
    theme.colors.primary.main,
    theme.colors.secondary.main,
    theme.colors.success.main,
    theme.colors.warning.main,
    theme.colors.error.main
  ];

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
          const value = maxValue * ratio;
          const y = padding + chartHeight - (ratio * chartHeight);
          
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
          const x = padding + (index * barGroupWidth) + barGroupWidth / 2;
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

        {/* Bars */}
        {processedData.map((item, groupIndex) => 
          item.values.map((valueObj, barIndex) => {
            const barHeight = getBarHeight(valueObj.value);
            const x = getBarX(groupIndex, barIndex);
            const y = padding + chartHeight - barHeight;
            
            return (
              <g key={`${groupIndex}-${barIndex}`}>
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill={colors[barIndex % colors.length]}
                  rx="2"
                  ry="2"
                />
                {/* Value labels on bars */}
                {barHeight > 20 && (
                  <text
                    x={x + barWidth / 2}
                    y={y - 5}
                    textAnchor="middle"
                    fontSize="10"
                    fill={theme.colors.text.primary}
                    fontWeight="500"
                  >
                    {valueObj.value}
                  </text>
                )}
              </g>
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
                borderRadius: '2px'
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

export default BarChart;