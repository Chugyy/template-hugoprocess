'use client';
import React, { useState, useEffect } from 'react';
import { SidebarProps } from '@/types/components';
import { useTheme } from '@/hooks';
import { usePathname } from 'next/navigation';
import NavigationItem from '@/components/molecules/NavigationItem';
import Button from '@/components/atoms/Button';
import Text from '@/components/atoms/Text';

const Sidebar: React.FC<SidebarProps> = ({
  width = '280px',
  collapsible = true,
  collapsed: controlledCollapsed,
  variant = 'default',
  onToggle,
  header,
  footer,
  children,
  className = ''
}) => {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const { theme } = useTheme();
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const collapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;

  const handleToggle = () => {
    if (onToggle) {
      onToggle(!collapsed);
    } else {
      setInternalCollapsed(!collapsed);
    }
  };

  const getWidth = () => {
    if (collapsed) return '60px';
    if (variant === 'mini') return '60px';
    return width;
  };

  const sidebarStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    width: isMobile ? '60px' : getWidth(),
    height: '100vh',
    backgroundColor: theme.colors.background.paper,
    borderRight: 'none',
    borderRadius: '0',
    boxShadow: theme.shadows.elevation['8'],
    position: variant === 'overlay' ? 'fixed' : 'relative',
    top: 0,
    left: 0,
    zIndex: variant === 'overlay' ? 1200 : 'auto',
    transition: isMobile ? 'none' : 'width 0.3s ease',
    overflow: 'hidden'
  };

  const contentStyle: React.CSSProperties = {
    flex: 1,
    overflow: 'auto',
    padding: theme.spacing.values.sm
  };

  const defaultNavigation = [
    { id: 'dashboard', label: 'Dashboard', href: '/', icon: 'home' },
    { id: 'analytics', label: 'Analytics', href: '/analytics', icon: 'analytics' },
    { id: 'ai', label: 'AI Chat', href: '/ai', icon: 'activity' },
    { id: 'users', label: 'Users', href: '/users', icon: 'users' },
    { id: 'cog', label: 'Settings', href: '/settings', icon: 'cog' }
  ];

  const defaultHeader = collapsible && (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: collapsed ? 'center' : 'space-between',
      padding: theme.spacing.values.md
    }}>
      {!collapsed && !isMobile && (
        <Text variant="h3" style={{ margin: 0, color: theme.colors.text.primary, fontFamily: theme.typography.fontFamily, fontWeight: 600 }}>
          Menu
        </Text>
      )}
      {!isMobile && (
        <Button
          variant="ghost"
          icon={collapsed ? 'menu' : 'chevron-left'}
          size="small"
          onClick={handleToggle}
          style={{ color: theme.colors.text.primary }}
        />
      )}
    </div>
  );

  const defaultFooter = (
    <div style={{ 
      padding: theme.spacing.values.lg,
      borderTop: `1px solid ${theme.colors.divider}`,
      textAlign: collapsed ? 'center' : 'left'
    }}>
      {!collapsed ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <Text variant="body2" style={{ color: theme.colors.text.secondary }}>
            Welcome back!
          </Text>
          <Text variant="caption" style={{ color: theme.colors.text.disabled }}>
            john@example.com
          </Text>
        </div>
      ) : (
        <Button variant="ghost" icon="user" size="small" />
      )}
    </div>
  );

  return (
    <aside className={className} style={sidebarStyle}>
      {header || defaultHeader}
      <div style={contentStyle}>
        {children || (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {defaultNavigation.map((item) => (
              <NavigationItem
                key={item.id}
                id={item.id}
                label={(collapsed || isMobile) ? '' : item.label}
                href={item.href}
                icon={item.icon}
                active={pathname === item.href}
              />
            ))}
          </div>
        )}
      </div>
      {footer || defaultFooter}
    </aside>
  );
};

export default Sidebar;