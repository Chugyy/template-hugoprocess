'use client';
import React from 'react';
import { HeaderProps } from '@/types/components';
import { useTheme } from '@/hooks';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import Text from '@/components/atoms/Text';
import SubModal from '@/components/molecules/SubModal';
import Tag from '@/components/atoms/Tag';

const Header: React.FC<HeaderProps> = ({
  height = '64px',
  sticky = true,
  logo,
  navigation,
  actions,
  className = ''
}) => {
  const { theme, toggleDarkMode, isDarkMode } = useTheme();

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height,
    padding: `0 ${theme.layout.container.padding}px`,
    backgroundColor: theme.colors.background.paper,
    borderBottom: `1px solid ${theme.colors.divider}`,
    position: sticky ? 'sticky' : 'relative',
    top: sticky ? 0 : 'auto',
    zIndex: 1000,
    gap: `${theme.layout.container.gap}px`
  };

  const defaultLogo = (
    <div style={{ display: 'flex', alignItems: 'center', gap: `${theme.components.gaps.standard}px` }}>
      {/* <Icon name="home" size={28} color={theme.colors.primary.main} />
      <Text variant="h3" style={{ margin: 0, color: theme.colors.text.primary }}>
        Dashboard
      </Text> */}
    </div>
  );

  const NotificationItem: React.FC<{ icon: string; color: string; message: string; time?: string }> = ({ icon, color, message, time }) => (
    <div style={{ 
      display: 'flex', 
      alignItems: 'flex-start', 
      gap: `${theme.components.gaps.standard}px`,
      padding: `${theme.components.gaps.standard}px ${theme.components.gaps.loose}px`,
      borderRadius: `${theme.components.borderRadius.medium}px`,
      backgroundColor: theme.colors.background.default,
      marginBottom: `${theme.components.gaps.tight}px`,
      cursor: 'pointer',
      transition: 'background-color 0.2s ease'
    }}
    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.colors.background.paper}
    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.colors.background.default}
    >
      <Icon name={icon} size={theme.components.icon.size} color={color} />
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: `${theme.components.gaps.tight}px` }}>
        <Text variant="body2" style={{ margin: 0, lineHeight: '1.4' }}>{message}</Text>
        {time && (
          <Text variant="caption" style={{ color: theme.colors.text.secondary, margin: 0, lineHeight: '1.2' }}>
            {time}
          </Text>
        )}
      </div>
    </div>
  );

  const ProfileMenuItem: React.FC<{ 
    icon: string; 
    label: string; 
    onClick: () => void; 
    badge?: React.ReactNode 
  }> = ({ icon, label, onClick, badge }) => (
    <div 
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: `${theme.components.gaps.loose}px`, 
        padding: `${theme.components.gaps.standard}px ${theme.layout.container.padding}px`, 
        cursor: 'pointer', 
        borderRadius: `${theme.components.borderRadius.small}px`,
        transition: 'background-color 0.2s ease'
      }} 
      onClick={onClick}
      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.colors.background.default}
      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
    >
      <Icon name={icon} size={theme.components.icon.size} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flex: 1 }}>
        <Text variant="body2">{label}</Text>
        {badge}
      </div>
    </div>
  );

  const defaultActions = (
    <div style={{ display: 'flex', alignItems: 'center', gap: `${theme.layout.container.gap}px` }}>
      <SubModal
        title="Notifications"
        placement="bottom-end"
        width="320px"
        footer={
          <Button 
            variant="tertiary" 
            size="small" 
            fullWidth
            onClick={() => console.log('Mark all as read')}
          >
            Tout marquer comme lu
          </Button>
        }
        trigger={
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <Button
              variant="icon"
              icon="bell"
              size="medium"
              onClick={() => {}}
            />
            <Tag
              label="3"
              color="error"
              size="small"
              variant="filled"
              style={{
                position: 'absolute',
                top: `-${theme.components.gaps.tight}px`,
                right: `-${theme.components.gaps.tight}px`,
                minWidth: '20px',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                fontSize: '10px',
                padding: '0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            />
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: `${theme.components.gaps.standard}px` }}>
          <NotificationItem 
            icon="info" 
            color={theme.colors.info.main} 
            message="Applique les nouveaux standards de design, dans le header (notification, profile, etc.) qui sont encore sur les anciens patterns." 
            time="Il y a 5 min"
          />
          <NotificationItem 
            icon="check" 
            color={theme.colors.success.main} 
            message="Tâche complétée avec succès" 
            time="Il y a 1h"
          />
          <NotificationItem 
            icon="bell" 
            color={theme.colors.warning.main} 
            message="Maintenance programmée dans 2h" 
            time="Il y a 2h"
          />
          <NotificationItem 
            icon="user" 
            color={theme.colors.text.secondary} 
            message="Nouvel utilisateur inscrit" 
            time="Il y a 1 jour"
          />
          <NotificationItem 
            icon="cog" 
            color={theme.colors.text.secondary} 
            message="Paramètres mis à jour" 
            time="Il y a 2 jours"
          />
        </div>
      </SubModal>
      <Button
        variant="icon"
        icon="dark-mode"
        size="medium"
        onClick={toggleDarkMode}
        style={{ 
          color: isDarkMode ? theme.colors.warning.main : theme.colors.text.secondary
        }}
      />
      <SubModal
        title="Mon Profil"
        placement="bottom-end"
        width="280px"
        footer={
          <ProfileMenuItem 
            icon="logout" 
            label="Déconnexion"
            onClick={() => console.log('Logout')}
          />
        }
        trigger={
          <Button
            variant="icon"
            icon="user"
            size="medium"
            onClick={() => {}}
          />
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: `${theme.components.gaps.tight}px` }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: `${theme.components.gaps.loose}px`,
            padding: `${theme.layout.container.padding}px`,
            backgroundColor: theme.colors.background.default,
            borderRadius: `${theme.components.borderRadius.medium}px`,
            marginBottom: `${theme.components.gaps.standard}px`,
            textAlign: 'center'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              minWidth: '48px',
              minHeight: '48px',
              backgroundColor: theme.colors.primary.main,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Icon name="user" size={20} color="white" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: `${theme.components.gaps.tight}px`, alignItems: 'center' }}>
              <Text variant="body2" style={{ fontWeight: 600, margin: 0, lineHeight: '1.2' }}>
                John Doe
              </Text>
              <Text variant="caption" style={{ color: theme.colors.text.secondary, margin: 0, lineHeight: '1.2' }}>
                john.doe@company.com
              </Text>
            </div>
          </div>
          <ProfileMenuItem 
            icon="user" 
            label="Mon profil"
            onClick={() => console.log('Profile')}
          />
          <ProfileMenuItem 
            icon="cog" 
            label="Paramètres"
            onClick={() => console.log('Settings')}
          />
        </div>
      </SubModal>
    </div>
  );

  return (
    <header className={className} style={headerStyle}>
      {logo || defaultLogo}
      {navigation && (
        <nav style={{ 
          flex: 1, 
          display: 'flex', 
          justifyContent: 'center',
          gap: `${theme.layout.container.gap}px`
        }}>
          {navigation}
        </nav>
      )}
      {actions || defaultActions}
    </header>
  );
};

export default Header;