import React, { HTMLAttributes } from 'react';
import styled from '@emotion/styled';
import theme from '../../theme';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const StyledCard = styled.div<CardProps>`
  border-radius: ${theme.borderRadius.lg};
  overflow: hidden;
  
  /* Variant styles */
  ${props => {
    switch (props.variant) {
      case 'elevated':
        return `
          background-color: ${theme.colors.background.tertiary};
          box-shadow: ${theme.shadows.md};
        `;
      case 'glass':
        return `
          background-color: ${theme.colors.glass.background};
          backdrop-filter: blur(${theme.colors.glass.blur});
          -webkit-backdrop-filter: blur(${theme.colors.glass.blur});
          border: 1px solid ${theme.colors.glass.border};
          box-shadow: 0 4px 30px ${theme.colors.glass.shadow};
        `;
      case 'default':
      default:
        return `
          background-color: ${theme.colors.background.tertiary};
          border: 1px solid ${theme.colors.ui.border};
        `;
    }
  }}
  
  /* Padding styles */
  ${props => {
    switch (props.padding) {
      case 'none':
        return 'padding: 0;';
      case 'sm':
        return `padding: ${theme.spacing[2]};`;
      case 'lg':
        return `padding: ${theme.spacing[6]};`;
      case 'md':
      default:
        return `padding: ${theme.spacing[4]};`;
    }
  }}
`;

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  ...props
}) => {
  return (
    <StyledCard
      variant={variant}
      padding={padding}
      {...props}
    >
      {children}
    </StyledCard>
  );
};

export default Card;
