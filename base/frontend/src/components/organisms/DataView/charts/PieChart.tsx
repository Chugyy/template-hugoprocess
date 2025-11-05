import React, { useMemo } from 'react';
import { ChartProps } from '@/types/components';
import { useTheme } from '@/hooks';
import Text from '@/components/atoms/Text';

const PieChart = <T extends Record<string, any>>({
  data,
  config,
  width,
  height = 300
}: ChartProps<T>) => {
  const { theme } = useTheme();

  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const { xAxis, yAxis } = config.data;
    const yField = yAxis[0]; // Use first y-axis field for pie chart
    
    return data.map(item => ({
      label: item[xAxis],
      value: Number(item[yField]) || 0
    }));
  }, [data, config.data]);

  const { total, dataWithAngles } = useMemo(() => {
    const total = processedData.reduce((sum, item) => sum + item.value, 0);
    let currentAngle = 0;
    
    const dataWithAngles = processedData.map(item => {
      const startAngle = currentAngle;
      const endAngle = currentAngle + (item.value / total) * 2 * Math.PI;
      currentAngle = endAngle;
      
      return {
        ...item,
        startAngle,
        endAngle,
        percentage: (item.value / total) * 100
      };
    });

    return { total, dataWithAngles };
  }, [processedData]);

  const svgSize = 400; // Fixed base size for calculations
  const radius = (svgSize - 100) / 2;
  const centerX = svgSize / 2;
  const centerY = svgSize / 2;

  const colors = config.colors || [
    theme.colors.primary.main,
    theme.colors.secondary.main,
    theme.colors.success.main,
    theme.colors.warning.main,
    theme.colors.error.main,
    theme.colors.info.main,
    '#8884d8',
    '#82ca9d',
    '#ffc658',
    '#ff7c7c'
  ];

  const createPath = (startAngle: number, endAngle: number, outerRadius: number, innerRadius = 0) => {
    const largeArcFlag = endAngle - startAngle <= Math.PI ? 0 : 1;
    
    const x1 = centerX + outerRadius * Math.cos(startAngle);
    const y1 = centerY + outerRadius * Math.sin(startAngle);
    const x2 = centerX + outerRadius * Math.cos(endAngle);
    const y2 = centerY + outerRadius * Math.sin(endAngle);

    if (innerRadius === 0) {
      return [
        'M', centerX, centerY,
        'L', x1, y1,
        'A', outerRadius, outerRadius, 0, largeArcFlag, 1, x2, y2,
        'Z'
      ].join(' ');
    }

    const x3 = centerX + innerRadius * Math.cos(endAngle);
    const y3 = centerY + innerRadius * Math.sin(endAngle);
    const x4 = centerX + innerRadius * Math.cos(startAngle);
    const y4 = centerY + innerRadius * Math.sin(startAngle);

    return [
      'M', x1, y1,
      'A', outerRadius, outerRadius, 0, largeArcFlag, 1, x2, y2,
      'L', x3, y3,
      'A', innerRadius, innerRadius, 0, largeArcFlag, 0, x4, y4,
      'Z'
    ].join(' ');
  };

  if (dataWithAngles.length === 0) {
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
          No data available for pie chart
        </Text>
      </div>
    );
  }

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'flex-start', 
      gap: theme.spacing.values.lg,
      flexWrap: 'wrap',
      justifyContent: 'center',
      width: '100%'
    }}>
      <div style={{ flex: '1 1 400px', maxWidth: '500px', display: 'flex', justifyContent: 'center' }}>
        <svg 
          width="100%" 
          height={height} 
          viewBox={`0 0 ${svgSize} ${svgSize}`}
          preserveAspectRatio="xMidYMid meet"
          style={{ display: 'block', maxWidth: '400px' }}>
        {dataWithAngles.map((item, index) => {
          const color = colors[index % colors.length];
          
          return (
            <g key={index}>
              <path
                d={createPath(item.startAngle, item.endAngle, radius)}
                fill={color}
                stroke={theme.colors.background.paper}
                strokeWidth={2}
                style={{ cursor: 'pointer' }}
              />
              
              {/* Percentage labels */}
              {item.percentage > 5 && (
                <text
                  x={centerX + (radius * 0.7) * Math.cos((item.startAngle + item.endAngle) / 2)}
                  y={centerY + (radius * 0.7) * Math.sin((item.startAngle + item.endAngle) / 2)}
                  textAnchor="middle"
                  fontSize="12"
                  fill={theme.colors.background.paper}
                  fontWeight="600"
                >
                  {item.percentage.toFixed(1)}%
                </text>
              )}
            </g>
          );
        })}
        </svg>
      </div>

      {/* Legend */}
      <div style={{
        flex: '1 1 250px',
        maxWidth: '300px',
        minWidth: '200px'
      }}>
        <Text variant="body2" style={{ fontWeight: 600, marginBottom: theme.spacing.values.sm }}>
          Legend
        </Text>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: theme.spacing.values.sm
        }}>
          {dataWithAngles.map((item, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.values.xs,
                padding: theme.spacing.values.xs,
                borderRadius: '4px',
                transition: 'background-color 0.2s'
              }}
            >
            <div
              style={{
                width: '12px',
                height: '12px',
                backgroundColor: colors[index % colors.length],
                borderRadius: '2px',
                flexShrink: 0
              }}
            />
              <div style={{ flex: 1, minWidth: 0 }}>
                <Text variant="caption" style={{ 
                  margin: 0,
                  display: 'block',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontWeight: 500
                }}>
                  {item.label}
                </Text>
                <Text variant="caption" style={{ 
                  margin: 0,
                  color: theme.colors.text.secondary,
                  fontSize: '0.7rem'
                }}>
                  {item.percentage.toFixed(1)}%
                </Text>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PieChart;