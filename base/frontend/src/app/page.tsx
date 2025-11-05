'use client';
import React from 'react';
import DashboardTemplate from '@/components/templates/DashboardTemplate';
import Header from '@/components/organisms/Header';
import Sidebar from '@/components/organisms/Sidebar';
import { DataView } from '@/components/organisms';
import { DataViewConfig } from '@/types/components';
import { useTheme } from '@/hooks';
import useMediaQuery from '@/hooks/useMediaQuery';
import Text from '@/components/atoms/Text';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import Tag from '@/components/atoms/Tag';

function DashboardContent() {
  const { theme } = useTheme();
  const isMobile = useMediaQuery('(max-width: 768px)');

  const dashboardData = [
    { month: 'Current', users: 32400, revenue: 1250000, orders: 5680, conversions: 4.8 }
  ];

  const chartData = [
    { month: 'Jan', users: 28500, revenue: 980000, orders: 4200, conversions: 3.8 },
    { month: 'Feb', users: 30100, revenue: 1120000, orders: 4890, conversions: 4.2 },
    { month: 'Mar', users: 32400, revenue: 1250000, orders: 5680, conversions: 4.8 },
    { month: 'Apr', users: 35200, revenue: 1420000, orders: 6100, conversions: 5.1 },
    { month: 'May', users: 38900, revenue: 1680000, orders: 6850, conversions: 5.4 },
    { month: 'Jun', users: 41200, revenue: 1890000, orders: 7320, conversions: 5.8 }
  ];

  const metricsConfig: DataViewConfig = {
    chart: 'metrics',
    title: 'Métriques Clés',
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
    height: 180
  };

  const chartConfig: DataViewConfig = {
    chart: 'line',
    title: 'Évolution des Métriques',
    data: {
      xAxis: 'month',
      yAxis: ['users'],
      aggregation: 'sum'
    },
    searchEngine: {
      searchableFields: ['month'],
      pageSize: 12
    },
    responsive: true,
    height: 280
  };

  const handleRefresh = () => {
    console.log('Refreshing dashboard data...');
  };

  const quickActions = [
    { icon: 'user-plus', label: 'Ajouter Utilisateur', color: theme.colors.primary.main, action: () => console.log('Add user') },
    { icon: 'file-text', label: 'Générer Rapport', color: theme.colors.secondary.main, action: () => console.log('Generate report') },
    { icon: 'bar-chart-2', label: 'Analytics', color: theme.colors.success.main, action: () => console.log('Analytics') },
    { icon: 'settings', label: 'Paramètres', color: theme.colors.warning.main, action: () => console.log('Settings') },
    { icon: 'download', label: 'Exporter Données', color: theme.colors.info.main, action: () => console.log('Export') },
    { icon: 'upload', label: 'Importer Fichier', color: theme.colors.error.main, action: () => console.log('Import') },
    { icon: 'mail', label: 'Envoyer Email', color: '#9333ea', action: () => console.log('Send email') },
    { icon: 'bell', label: 'Notifications', color: '#f59e0b', action: () => console.log('Notifications') },
    { icon: 'users', label: 'Gérer Équipe', color: '#06b6d4', action: () => console.log('Manage team') },
    { icon: 'lock', label: 'Sécurité', color: '#dc2626', action: () => console.log('Security') },
    { icon: 'database', label: 'Base de Données', color: '#059669', action: () => console.log('Database') },
    { icon: 'globe', label: 'Site Web', color: '#7c3aed', action: () => console.log('Website') }
  ];

  const recentActivities = [
    { icon: 'user-plus', action: 'Nouvel utilisateur John Doe inscrit', time: 'Il y a 2 min', color: theme.colors.primary.main },
    { icon: 'shopping-cart', action: 'Commande #1234 passée', time: 'Il y a 5 min', color: theme.colors.success.main },
    { icon: 'credit-card', action: 'Paiement traité pour #1233', time: 'Il y a 12 min', color: theme.colors.info.main },
    { icon: 'message-circle', action: 'Nouveau commentaire reçu', time: 'Il y a 1h', color: theme.colors.secondary.main },
    { icon: 'alert-circle', action: 'Alerte système résolue', time: 'Il y a 2h', color: theme.colors.warning.main }
  ];

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: `${theme.layout.container.gap}px`,
      padding: `${theme.layout.container.padding}px`
    }}>
      {/* Header Section */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: `${theme.components.gaps.standard}px`
      }}>
        <div>
          <Text variant="h1" style={{ margin: 0, marginBottom: `${theme.components.gaps.tight}px` }}>
            Dashboard
          </Text>
          <Text variant="body1" style={{ color: theme.colors.text.secondary, margin: 0 }}>
            Vue d'ensemble de vos métriques clés en temps réel
          </Text>
        </div>
        <div style={{ display: 'flex', gap: `${theme.components.gaps.standard}px`, alignItems: 'center' }}>
          <Tag 
            label="En ligne" 
            color="success" 
            variant="filled" 
            size="medium"
            style={{
              height: `${theme.components.heights.medium}px`,
              display: 'flex',
              alignItems: 'center',
              padding: `0 ${theme.components.padding.medium.horizontal}px`,
              fontSize: '0.875rem'
            }}
          />
          <Button variant="primary" icon="refresh-cw" onClick={handleRefresh}>
            Actualiser
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <DataView
        config={metricsConfig}
        data={dashboardData}
      />

      {/* Main Content Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr', 
        gap: `${theme.layout.container.gap}px`
      }}>
        {/* Chart Section */}
        <div style={{
          backgroundColor: theme.colors.background.paper,
          borderRadius: `${theme.components.borderRadius.large}px`,
          border: `1px solid ${theme.colors.divider}`,
          overflow: 'hidden'
        }}>
          <DataView
            config={chartConfig}
            data={chartData}
          />
        </div>

        {/* Quick Actions */}
        <div style={{
          backgroundColor: theme.colors.background.paper,
          borderRadius: `${theme.components.borderRadius.large}px`,
          border: `1px solid ${theme.colors.divider}`,
          padding: `${theme.layout.container.padding}px`
        }}>
          <Text variant="h3" style={{ margin: 0, marginBottom: `${theme.components.gaps.loose}px` }}>
            Actions Rapides
          </Text>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: `${theme.components.gaps.standard}px`,
            maxHeight: '300px',
            overflowY: 'auto'
          }}>
            {quickActions.map((action, index) => (
              <div
                key={index}
                onClick={action.action}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: `${theme.components.gaps.standard}px`,
                  padding: `${theme.components.gaps.standard}px`,
                  backgroundColor: theme.colors.background.default,
                  borderRadius: `${theme.components.borderRadius.medium}px`,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  border: `1px solid ${theme.colors.divider}`,
                  minHeight: '56px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.borderColor = action.color;
                  e.currentTarget.style.boxShadow = `0 4px 12px ${action.color}20`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = theme.colors.divider;
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{
                  backgroundColor: action.color + '15',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Icon name={action.icon} size={theme.components.icon.size} style={{ color: action.color }} />
                </div>
                <Text variant="caption" style={{ 
                  margin: 0, 
                  fontWeight: 500,
                  lineHeight: '1.3',
                  flex: 1,
                  textAlign: 'left'
                }}>
                  {action.label}
                </Text>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activities Section */}
      <div style={{
        backgroundColor: theme.colors.background.paper,
        borderRadius: `${theme.components.borderRadius.large}px`,
        border: `1px solid ${theme.colors.divider}`,
        padding: `${theme.layout.container.padding}px`
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: `${theme.components.gaps.loose}px`
        }}>
          <Text variant="h3" style={{ margin: 0 }}>
            Activités Récentes
          </Text>
          <Button variant="tertiary" size="small">
            Voir tout
          </Button>
        </div>
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: `${theme.components.gaps.standard}px`
        }}>
          {recentActivities.map((activity, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: `${theme.components.gaps.standard}px`,
                padding: `${theme.components.gaps.standard}px`,
                backgroundColor: theme.colors.background.default,
                borderRadius: `${theme.components.borderRadius.medium}px`,
                border: `1px solid ${theme.colors.divider}`
              }}
            >
              <div style={{
                backgroundColor: activity.color + '20',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Icon name={activity.icon} size={14} style={{ color: activity.color }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Text variant="body2" style={{ 
                  margin: 0, 
                  marginBottom: `${theme.components.gaps.tight / 2}px`,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {activity.action}
                </Text>
                <Text variant="caption" style={{ 
                  color: theme.colors.text.secondary, 
                  margin: 0 
                }}>
                  {activity.time}
                </Text>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <DashboardTemplate
      header={<Header />}
      sidebar={<Sidebar />}
    >
      <DashboardContent />
    </DashboardTemplate>
  );
}
