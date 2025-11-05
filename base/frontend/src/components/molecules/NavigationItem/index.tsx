import React from 'react';
import { NavigationItemProps } from '@/types/components';
import { useTheme } from '@/hooks';
import { useRouter } from 'next/navigation';
import Icon from '@/components/atoms/Icon';
import Text from '@/components/atoms/Text';
import Tag from '@/components/atoms/Tag';

const NavigationItem: React.FC<NavigationItemProps> = ({
  id,
  label,
  href,
  onClick,
  active = false,
  disabled = false,
  expanded,
  icon,
  tag,
  children,
  depth = 0
}) => {
  const { theme } = useTheme();
  const router = useRouter();

  const itemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing.values.sm,
    padding: `${theme.spacing.values.md}px`,
    marginBottom: '8px',
    backgroundColor: active ? theme.colors.primary.main : 'transparent',
    color: active ? theme.colors.primary.contrastText : (disabled ? theme.colors.text.disabled : theme.colors.text.secondary),
    cursor: disabled ? 'not-allowed' : 'pointer',
    textDecoration: 'none',
    borderRadius: '12px',
    transition: 'all 0.2s ease',
    border: 'none'
  };

  const content = (
    <>
      {icon && <Icon name={icon} size={16} />}
      {label && <Text variant="body2" style={{ flex: 1, fontFamily: theme.typography.fontFamily, fontWeight: active ? '600' : '400' }}>{label}</Text>}
      {tag && <Tag {...tag} size="small" />}
      {children && (
        <Icon name={expanded ? 'chevron-down' : 'chevron-right'} size={12} />
      )}
    </>
  );

  const handleClick = (e: React.MouseEvent) => {
    if (disabled) return;
    if (href) {
      e.preventDefault();
      router.push(href);
    }
    onClick?.(e);
  };

  if (href) {
    return (
      <a 
        href={href} 
        style={itemStyle} 
        onClick={handleClick}
        onMouseEnter={(e) => {
          if (!active && !disabled) {
            e.currentTarget.style.backgroundColor = theme.colors.background.default;
          }
        }}
        onMouseLeave={(e) => {
          if (!active) {
            e.currentTarget.style.backgroundColor = 'transparent';
          }
        }}
      >
        {content}
      </a>
    );
  }

  return (
    <div 
      style={itemStyle} 
      onClick={handleClick}
      onMouseEnter={(e) => {
        if (!active && !disabled) {
          e.currentTarget.style.backgroundColor = theme.colors.background.default;
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.backgroundColor = 'transparent';
        }
      }}
    >
      {content}
    </div>
  );
};

export default NavigationItem;