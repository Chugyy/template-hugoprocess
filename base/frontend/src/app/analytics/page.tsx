'use client';

import React, { useState } from 'react';
import DashboardTemplate from '@/components/templates/DashboardTemplate';
import Header from '@/components/organisms/Header';
import Sidebar from '@/components/organisms/Sidebar';
import { DataView } from '@/components/organisms';
import { DataViewConfig } from '@/types/components';
import { useTheme } from '@/hooks';
import Text from '@/components/atoms/Text';

const analyticsData = [
  { month: 'Jan', users: 1200, revenue: 45000, orders: 180, conversions: 3.2, sessions: 15000, bounce_rate: 42.1 },
  { month: 'Feb', users: 1400, revenue: 52000, orders: 220, conversions: 3.8, sessions: 17500, bounce_rate: 39.8 },
  { month: 'Mar', users: 1800, revenue: 68000, orders: 280, conversions: 4.1, sessions: 22000, bounce_rate: 37.5 },
  { month: 'Apr', users: 1600, revenue: 58000, orders: 240, conversions: 3.9, sessions: 19500, bounce_rate: 38.2 },
  { month: 'May', users: 2200, revenue: 82000, orders: 350, conversions: 4.5, sessions: 28000, bounce_rate: 35.1 },
  { month: 'Jun', users: 2800, revenue: 95000, orders: 420, conversions: 4.8, sessions: 34500, bounce_rate: 33.8 },
  { month: 'Jul', users: 3200, revenue: 110000, orders: 480, conversions: 5.2, sessions: 39000, bounce_rate: 32.4 },
  { month: 'Aug', users: 2900, revenue: 98000, orders: 440, conversions: 4.9, sessions: 36500, bounce_rate: 34.1 },
  { month: 'Sep', users: 3400, revenue: 125000, orders: 520, conversions: 5.5, sessions: 42000, bounce_rate: 31.2 },
  { month: 'Oct', users: 3800, revenue: 140000, orders: 580, conversions: 5.8, sessions: 46500, bounce_rate: 29.8 },
  { month: 'Nov', users: 4200, revenue: 155000, orders: 640, conversions: 6.1, sessions: 51000, bounce_rate: 28.5 },
  { month: 'Dec', users: 4600, revenue: 175000, orders: 720, conversions: 6.5, sessions: 56000, bounce_rate: 27.2 }
];

function AnalyticsContent() {
  const { theme } = useTheme();
  const [currentChart, setCurrentChart] = useState<'line' | 'bar' | 'pie' | 'area' | 'metrics' | 'scatter'>('line');

  const chartConfigs: Record<string, DataViewConfig> = {
    line: {
      chart: 'line',
      title: 'User Growth & Revenue Trends',
      data: {
        xAxis: 'month',
        yAxis: ['users', 'revenue'],
        aggregation: 'sum'
      },
      searchEngine: {
        searchableFields: ['month'],
        pageSize: 12
      },
      colors: ['#3B82F6', '#10B981'],
      responsive: true,
      height: 400
    },
    bar: {
      chart: 'bar',
      title: 'Monthly Performance Comparison',
      data: {
        xAxis: 'month',
        yAxis: ['orders', 'conversions'],
        aggregation: 'sum'
      },
      searchEngine: {
        searchableFields: ['month'],
        pageSize: 12
      },
      colors: ['#8B5CF6', '#F59E0B'],
      responsive: true,
      height: 400
    },
    pie: {
      chart: 'pie',
      title: 'Revenue Distribution by Quarter',
      data: {
        xAxis: 'month',
        yAxis: ['revenue'],
        groupBy: 'month'
      },
      searchEngine: {
        searchableFields: ['month'],
        pageSize: 4
      },
      colors: ['#EF4444', '#F97316', '#EAB308', '#22C55E'],
      responsive: true,
      height: 400
    },
    area: {
      chart: 'area',
      title: 'Sessions & Bounce Rate Evolution',
      data: {
        xAxis: 'month',
        yAxis: ['sessions', 'bounce_rate'],
        aggregation: 'avg'
      },
      searchEngine: {
        searchableFields: ['month'],
        pageSize: 12
      },
      colors: ['#06B6D4', '#EF4444'],
      responsive: true,
      height: 400
    },
    metrics: {
      chart: 'metrics',
      title: 'Key Performance Indicators',
      data: {
        xAxis: 'month',
        yAxis: ['users', 'revenue', 'orders', 'conversions'],
        aggregation: 'sum'
      },
      searchEngine: {
        searchableFields: ['month'],
        pageSize: 12
      },
      responsive: true,
      height: 300
    },
    scatter: {
      chart: 'scatter',
      title: 'Users vs Revenue Correlation',
      data: {
        xAxis: 'users',
        yAxis: ['revenue', 'orders'],
        aggregation: 'sum'
      },
      searchEngine: {
        searchableFields: ['month'],
        pageSize: 12
      },
      colors: ['#8B5CF6'],
      responsive: true,
      height: 400
    }
  };

  const handleChartChange = (chart: DataViewConfig['chart']) => {
    setCurrentChart(chart);
  };

  const handleRefresh = () => {
    console.log('Refreshing analytics data...');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.values.lg }}>
      <div>
        <Text variant="h1" style={{ margin: 0, marginBottom: theme.spacing.values.sm }}>
          Analytics
        </Text>
        <Text variant="body1" style={{ color: theme.colors.text.secondary, margin: 0 }}>
          Visualisez et analysez vos données de performance avec des graphiques interactifs
        </Text>
      </div>

      <DataView
        config={chartConfigs[currentChart]}
        data={analyticsData}
        toolbar={{
          search: true,
          chartSwitcher: true,
          export: true,
          refresh: true
        }}
        onChartChange={handleChartChange}
        onRefresh={handleRefresh}
      />

      {/* Quick Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: theme.spacing.values.md
      }}>
        <div style={{
          backgroundColor: theme.colors.background.paper,
          border: `1px solid ${theme.colors.divider}`,
          borderRadius: `${theme.components.borderRadius.large}px`,
          padding: theme.spacing.values.md
        }}>
          <Text variant="caption" style={{ color: theme.colors.text.secondary, textTransform: 'uppercase', fontWeight: 600 }}>
            Total Users
          </Text>
          <Text variant="h2" style={{ margin: '8px 0 0 0' }}>
            {analyticsData.reduce((sum, item) => sum + item.users, 0).toLocaleString()}
          </Text>
        </div>
        
        <div style={{
          backgroundColor: theme.colors.background.paper,
          border: `1px solid ${theme.colors.divider}`,
          borderRadius: `${theme.components.borderRadius.large}px`,
          padding: theme.spacing.values.md
        }}>
          <Text variant="caption" style={{ color: theme.colors.text.secondary, textTransform: 'uppercase', fontWeight: 600 }}>
            Total Revenue
          </Text>
          <Text variant="h2" style={{ margin: '8px 0 0 0', color: theme.colors.success.main }}>
            ${analyticsData.reduce((sum, item) => sum + item.revenue, 0).toLocaleString()}
          </Text>
        </div>
        
        <div style={{
          backgroundColor: theme.colors.background.paper,
          border: `1px solid ${theme.colors.divider}`,
          borderRadius: `${theme.components.borderRadius.large}px`,
          padding: theme.spacing.values.md
        }}>
          <Text variant="caption" style={{ color: theme.colors.text.secondary, textTransform: 'uppercase', fontWeight: 600 }}>
            Avg Conversion
          </Text>
          <Text variant="h2" style={{ margin: '8px 0 0 0', color: theme.colors.warning.main }}>
            {(analyticsData.reduce((sum, item) => sum + item.conversions, 0) / analyticsData.length).toFixed(1)}%
          </Text>
        </div>
        
        <div style={{
          backgroundColor: theme.colors.background.paper,
          border: `1px solid ${theme.colors.divider}`,
          borderRadius: `${theme.components.borderRadius.large}px`,
          padding: theme.spacing.values.md
        }}>
          <Text variant="caption" style={{ color: theme.colors.text.secondary, textTransform: 'uppercase', fontWeight: 600 }}>
            Total Orders
          </Text>
          <Text variant="h2" style={{ margin: '8px 0 0 0' }}>
            {analyticsData.reduce((sum, item) => sum + item.orders, 0).toLocaleString()}
          </Text>
        </div>
      </div>
    </div>
  );
}

export default function Analytics() {
  return (
    <DashboardTemplate
      header={<Header />}
      sidebar={<Sidebar />}
    >
      <AnalyticsContent />
    </DashboardTemplate>
  );
}