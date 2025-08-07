import React, { useState, useRef, useEffect } from 'react';
import styled from '@emotion/styled';
import theme from '../../theme';

type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

interface TooltipProps {
  content: string;
  children: React.ReactElement;
  position?: TooltipPosition;
  delay?: number;
}

const TooltipContainer = styled.div`
  position: relative;
  display: inline-block;
`;

const TooltipContent = styled.div<{ 
  position: string; 
  isVisible: boolean; 
  x: number; 
  y: number; 
}>`
  position: fixed;
  z-index: ${theme.zIndices.tooltip};
  background-color: ${theme.colors.glass.background};
  backdrop-filter: blur(${theme.colors.glass.blur});
  -webkit-backdrop-filter: blur(${theme.colors.glass.blur});
  color: ${theme.colors.text.primary};
  padding: ${theme.spacing[2]} ${theme.spacing[3]};
  border-radius: ${theme.borderRadius.md};
  font-size: ${theme.typography.fontSize.sm};
  white-space: nowrap;
  box-shadow: ${theme.shadows.lg};
  border: 1px solid ${theme.colors.glass.border};
  pointer-events: none;
  opacity: ${props => props.isVisible ? 1 : 0};
  visibility: ${props => props.isVisible ? 'visible' : 'hidden'};
  transition: opacity 0.2s, visibility 0.2s;
  left: ${props => props.x}px;
  top: ${props => props.y}px;
  transform: ${props => {
    switch (props.position) {
      case 'top':
        return 'translate(-50%, -100%) translateY(-8px)';
      case 'bottom':
        return 'translate(-50%, 0%) translateY(8px)';
      case 'left':
        return 'translate(-100%, -50%) translateX(-8px)';
      case 'right':
        return 'translate(0%, -50%) translateX(8px)';
      default:
        return 'translate(-50%, -100%) translateY(-8px)';
    }
  }};

  &::before {
    content: '';
    position: absolute;
    width: 0;
    height: 0;
    border-style: solid;
    ${props => {
      switch (props.position) {
        case 'top':
          return `
            top: 100%;
            left: 50%;
            transform: translateX(-50%);
            border-width: 6px 6px 0 6px;
            border-color: ${theme.colors.glass.background} transparent transparent transparent;
          `;
        case 'bottom':
          return `
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%);
            border-width: 0 6px 6px 6px;
            border-color: transparent transparent ${theme.colors.glass.background} transparent;
          `;
        case 'left':
          return `
            top: 50%;
            left: 100%;
            transform: translateY(-50%);
            border-width: 6px 0 6px 6px;
            border-color: transparent transparent transparent ${theme.colors.glass.background};
          `;
        case 'right':
          return `
            top: 50%;
            right: 100%;
            transform: translateY(-50%);
            border-width: 6px 6px 6px 0;
            border-color: transparent ${theme.colors.glass.background} transparent transparent;
          `;
        default:
          return `
            top: 100%;
            left: 50%;
            transform: translateX(-50%);
            border-width: 6px 6px 0 6px;
            border-color: ${theme.colors.glass.background} transparent transparent transparent;
          `;
      }
    }}
  }
`;

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  delay = 500
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [actualPosition, setActualPosition] = useState<TooltipPosition>(position);
  const timeoutRef = useRef<number | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

  const calculatePosition = (rect: DOMRect, preferredPosition: TooltipPosition) => {
    const tooltipWidth = 200; // Estimated tooltip width
    const tooltipHeight = 40; // Estimated tooltip height
    const margin = 8;
    
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let finalPosition: TooltipPosition = preferredPosition;
    let x, y;

    // Calculate initial position
    switch (preferredPosition) {
      case 'top':
        x = rect.left + rect.width / 2;
        y = rect.top;
        // Check if tooltip would go above viewport
        if (y - tooltipHeight - margin < 0) {
          finalPosition = 'bottom';
          y = rect.bottom;
        }
        break;
      case 'bottom':
        x = rect.left + rect.width / 2;
        y = rect.bottom;
        // Check if tooltip would go below viewport
        if (y + tooltipHeight + margin > viewportHeight) {
          finalPosition = 'top';
          y = rect.top;
        }
        break;
      case 'left':
        x = rect.left;
        y = rect.top + rect.height / 2;
        // Check if tooltip would go left of viewport
        if (x - tooltipWidth - margin < 0) {
          finalPosition = 'right';
          x = rect.right;
        }
        break;
      case 'right':
        x = rect.right;
        y = rect.top + rect.height / 2;
        // Check if tooltip would go right of viewport
        if (x + tooltipWidth + margin > viewportWidth) {
          finalPosition = 'left';
          x = rect.left;
        }
        break;
      default:
        x = rect.left + rect.width / 2;
        y = rect.top;
        finalPosition = 'top';
    }

    // Ensure tooltip doesn't go off screen horizontally
    if (finalPosition === 'top' || finalPosition === 'bottom') {
      x = Math.max(tooltipWidth / 2 + margin, Math.min(x, viewportWidth - tooltipWidth / 2 - margin));
    }

    // Ensure tooltip doesn't go off screen vertically
    if (finalPosition === 'left' || finalPosition === 'right') {
      y = Math.max(tooltipHeight / 2 + margin, Math.min(y, viewportHeight - tooltipHeight / 2 - margin));
    }

    return { x, y, position: finalPosition };
  };

  const showTooltip = (event: React.MouseEvent) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = window.setTimeout(() => {
      const rect = (event.target as HTMLElement).getBoundingClientRect();
      const { x, y, position: calculatedPosition } = calculatePosition(rect, position);
      
      setCoords({ x, y });
      setActualPosition(calculatedPosition);
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <TooltipContainer 
      ref={containerRef}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
    >
      {children}
      <TooltipContent
        position={actualPosition}
        isVisible={isVisible}
        x={coords.x}
        y={coords.y}
      >
        {content}
      </TooltipContent>
    </TooltipContainer>
  );
};

export default Tooltip;
