'use client';
import React from 'react';
import { useTheme } from '@/hooks';

interface DashboardTemplateProps {
  header?: React.ReactNode;
  sidebar?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  scrollable?: boolean;
}

const DashboardTemplate: React.FC<DashboardTemplateProps> = ({
  header,
  sidebar,
  children,
  className = '',
  scrollable = true
}) => {
  const { theme } = useTheme();

  return (
    <div 
      className={className}
      style={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: theme.colors.background.default,
        color: theme.colors.text.primary,
        fontFamily: theme.typography.fontFamily
      }}
    >
      {sidebar && (
        <div style={{ flexShrink: 0 }}>
          {sidebar}
        </div>
      )}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        flex: 1,
        minWidth: 0,
        height: '100vh'
      }}>
        {header && (
          <div style={{ flexShrink: 0 }}>
            {header}
          </div>
        )}
        <main style={{ 
          flex: 1,
          padding: scrollable ? theme.spacing.values.lg : 0,
          overflowY: scrollable ? 'auto' : 'hidden',
          minHeight: 0
        }}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardTemplate;