import React, { useState, useRef, useEffect } from 'react';
import { DropdownProps } from '@/types/components';
import { useTheme } from '@/hooks';

const Dropdown: React.FC<DropdownProps> = ({
  trigger = 'click',
  placement = 'bottom-start',
  offset = 4,
  closeOnItemClick = true,
  children,
  content,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleTrigger = () => {
    if (trigger === 'click') {
      setIsOpen(!isOpen);
    }
  };

  const handleMouseEnter = () => {
    if (trigger === 'hover') {
      setIsOpen(true);
    }
  };

  const handleMouseLeave = () => {
    if (trigger === 'hover') {
      setIsOpen(false);
    }
  };

  const getPlacementStyles = (): React.CSSProperties => {
    const base = {
      position: 'absolute' as const,
      zIndex: 1000,
      minWidth: '200px'
    };

    switch (placement) {
      case 'top-start':
        return { ...base, bottom: '100%', left: 0, marginBottom: `${offset}px` };
      case 'top':
        return { ...base, bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: `${offset}px` };
      case 'top-end':
        return { ...base, bottom: '100%', right: 0, marginBottom: `${offset}px` };
      case 'bottom':
        return { ...base, top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: `${offset}px` };
      case 'bottom-end':
        return { ...base, top: '100%', right: 0, marginTop: `${offset}px` };
      case 'left':
        return { ...base, right: '100%', top: 0, marginRight: `${offset}px` };
      case 'right':
        return { ...base, left: '100%', top: 0, marginLeft: `${offset}px` };
      default: // bottom-start
        return { ...base, top: '100%', left: 0, marginTop: `${offset}px` };
    }
  };

  const dropdownStyle: React.CSSProperties = {
    backgroundColor: theme.colors.background.paper,
    border: `1px solid ${theme.colors.divider}`,
    borderRadius: `${theme.components.borderRadius.medium}px`,
    boxShadow: theme.shadows.elevation['8'],
    padding: `${theme.components.gaps.standard}px 0`,
    opacity: isOpen ? 1 : 0,
    transform: isOpen ? 'translateY(0)' : 'translateY(-8px)',
    transition: 'opacity 0.2s ease, transform 0.2s ease',
    ...getPlacementStyles()
  };

  const handleContentClick = () => {
    if (closeOnItemClick) {
      setIsOpen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ position: 'relative', display: 'inline-block' }}
      onClick={handleTrigger}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      <div
        style={{
          ...dropdownStyle,
          visibility: isOpen ? 'visible' : 'hidden',
          pointerEvents: isOpen ? 'auto' : 'none'
        }}
        onClick={handleContentClick}
      >
        {content}
      </div>
    </div>
  );
};

export default Dropdown;