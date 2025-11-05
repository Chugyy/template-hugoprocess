import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '@/hooks';
import Button from '@/components/atoms/Button';
import Text from '@/components/atoms/Text';

interface SubModalCategory {
  key: string;
  label: string;
  children: React.ReactNode;
}

interface SubModalProps {
  trigger: React.ReactNode;
  title?: string;
  categories?: SubModalCategory[];
  children?: React.ReactNode;
  footer?: React.ReactNode;
  placement?: 'bottom-start' | 'bottom-end' | 'bottom-center';
  width?: string;
  onClose?: () => void;
}

const SubModal: React.FC<SubModalProps> = ({
  trigger,
  title,
  categories = [],
  children,
  footer,
  placement = 'bottom-start',
  width = '320px',
  onClose
}) => {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>(categories[0]?.key || '');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        onClose?.();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  const toggleModal = () => {
    setIsOpen(!isOpen);
  };

  const getPlacementStyles = (): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      position: 'absolute',
      top: '100%',
      zIndex: 1000,
      marginTop: `${theme.components.gaps.tight}px`
    };

    switch (placement) {
      case 'bottom-start':
        return { ...baseStyles, left: 0 };
      case 'bottom-end':
        return { ...baseStyles, right: 0 };
      case 'bottom-center':
        return { ...baseStyles, left: '50%', transform: 'translateX(-50%)' };
      default:
        return { ...baseStyles, left: 0 };
    }
  };

  const modalStyle: React.CSSProperties = {
    ...getPlacementStyles(),
    width,
    backgroundColor: theme.colors.background.paper,
    border: `1px solid ${theme.colors.divider}`,
    borderRadius: `${theme.components.borderRadius.large}px`,
    boxShadow: theme.shadows.elevation['8'],
    overflow: 'hidden'
  };

  const headerStyle: React.CSSProperties = {
    padding: `${theme.layout.container.padding}px`,
    borderBottom: `1px solid ${theme.colors.divider}`,
    backgroundColor: theme.colors.background.default
  };

  const categoryTabsStyle: React.CSSProperties = {
    display: 'flex',
    borderBottom: `1px solid ${theme.colors.divider}`,
    backgroundColor: theme.colors.background.default
  };

  const categoryTabStyle = (isActive: boolean): React.CSSProperties => ({
    flex: 1,
    padding: `${theme.components.gaps.standard}px`,
    textAlign: 'center',
    cursor: 'pointer',
    backgroundColor: isActive ? theme.colors.background.paper : 'transparent',
    borderBottom: isActive ? `2px solid ${theme.colors.primary.main}` : 'none',
    transition: 'all 0.2s ease'
  });

  const contentStyle: React.CSSProperties = {
    padding: `${theme.layout.container.padding}px`,
    maxHeight: '400px',
    overflowY: 'auto'
  };

  const footerStyle: React.CSSProperties = {
    padding: `${theme.layout.container.padding}px`,
    borderTop: `1px solid ${theme.colors.divider}`,
    backgroundColor: theme.colors.background.default
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
      <div onClick={toggleModal} style={{ cursor: 'pointer' }}>
        {trigger}
      </div>
      
      {isOpen && (
        <div style={modalStyle}>
          {title && (
            <div style={headerStyle}>
              <Text variant="body2" style={{ fontWeight: 600, margin: 0 }}>
                {title}
              </Text>
            </div>
          )}
          
          {categories.length > 0 && (
            <>
              <div style={categoryTabsStyle}>
                {categories.map(category => (
                  <div
                    key={category.key}
                    style={categoryTabStyle(activeCategory === category.key)}
                    onClick={() => setActiveCategory(category.key)}
                  >
                    <Text variant="caption" style={{ 
                      fontWeight: 500, 
                      margin: 0,
                      color: activeCategory === category.key ? theme.colors.primary.main : theme.colors.text.secondary
                    }}>
                      {category.label}
                    </Text>
                  </div>
                ))}
              </div>
              
              <div style={contentStyle}>
                {categories.find(cat => cat.key === activeCategory)?.children}
              </div>
            </>
          )}
          
          {!categories.length && children && (
            <div style={contentStyle}>
              {children}
            </div>
          )}
          
          {footer && (
            <div style={footerStyle}>
              {footer}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SubModal;