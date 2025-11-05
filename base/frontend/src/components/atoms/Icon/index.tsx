import React from 'react';

interface IconProps {
  name: string;
  size?: number | string;
  color?: string;
  className?: string;
}

const Icon: React.FC<IconProps> = ({ name, size = 24, color, className = '' }) => {
  const iconStyle: React.CSSProperties = {
    width: size,
    height: size,
    backgroundColor: color || 'currentColor',
    maskImage: `url(/icons/${name}.svg)`,
    WebkitMaskImage: `url(/icons/${name}.svg)`,
    maskRepeat: 'no-repeat',
    WebkitMaskRepeat: 'no-repeat',
    maskPosition: 'center',
    WebkitMaskPosition: 'center',
    maskSize: 'contain',
    WebkitMaskSize: 'contain',
    display: 'inline-block',
    flexShrink: 0
  };

  return (
    <span 
      className={`icon icon-${name} ${className}`}
      style={iconStyle}
      role="img"
      aria-label={name}
    />
  );
};

export default Icon;