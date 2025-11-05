'use client';
import React, { useState, useEffect } from 'react';
import { ThinkingBubbleProps } from '@/types/components';
import { useTheme } from '@/hooks';
import Text from '@/components/atoms/Text';

const ThinkingBubble: React.FC<ThinkingBubbleProps> = ({ 
  steps = [], 
  visible, 
  className = '' 
}) => {
  const { theme } = useTheme();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');

  useEffect(() => {
    if (!visible || steps.length === 0) {
      setCurrentStepIndex(0);
      setCurrentText('');
      return;
    }

    let timeoutId: NodeJS.Timeout;
    
    if (currentStepIndex < steps.length) {
      const step = steps[currentStepIndex];
      setCurrentText(step.content);
      
      timeoutId = setTimeout(() => {
        setCurrentStepIndex(prev => prev + 1);
      }, step.duration || 1000);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [visible, steps, currentStepIndex]);

  if (!visible) return null;

  const bubbleStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing.values.sm,
    padding: theme.spacing.values.md,
    backgroundColor: theme.colors.background.paper,
    border: `1px solid ${theme.colors.divider}`,
    borderRadius: `${theme.components.borderRadius.large}px`,
    maxWidth: '70%',
    marginBottom: theme.spacing.values.sm,
    position: 'relative'
  };

  const dotsStyle: React.CSSProperties = {
    display: 'flex',
    gap: '4px'
  };

  const dotStyle: React.CSSProperties = {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: theme.colors.primary.main,
    animation: 'pulse 1.5s ease-in-out infinite'
  };

  return (
    <div className={className} style={bubbleStyle}>
      <div style={dotsStyle}>
        <div style={{ ...dotStyle, animationDelay: '0ms' }}></div>
        <div style={{ ...dotStyle, animationDelay: '150ms' }}></div>
        <div style={{ ...dotStyle, animationDelay: '300ms' }}></div>
      </div>
      {currentText && (
        <Text 
          variant="body2" 
          style={{ 
            color: theme.colors.text.secondary,
            fontStyle: 'italic'
          }}
        >
          {currentText}
        </Text>
      )}
      <style jsx>{`
        @keyframes pulse {
          0%, 60%, 100% {
            transform: scale(0.8);
            opacity: 0.5;
          }
          30% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default ThinkingBubble;