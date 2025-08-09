import React, { ButtonHTMLAttributes } from 'react';
import styled from '@emotion/styled';
import theme from '../../theme';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'primary' | 'transparent' | 'glass';
  isActive?: boolean;
}

const StyledIconButton = styled.button<IconButtonProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: ${theme.borderRadius.md};
  transition: ${theme.transitions.default};
  flex-shrink: 0;
  
  /* Size styles */
  ${props => {
    switch (props.size) {
      case 'sm':
        return `
          width: 28px;
          height: 28px;
          font-size: ${theme.typography.fontSize.sm};
        `;
      case 'lg':
        return `
          width: 44px;
          height: 44px;
          font-size: ${theme.typography.fontSize.lg};
        `;
      case 'md':
      default:
        return `
          width: 36px;
          height: 36px;
          font-size: ${theme.typography.fontSize.md};
        `;
    }
  }}
  
  /* Variant styles */
  ${props => {
    switch (props.variant) {
      case 'primary':
        return `
          background-color: ${theme.colors.button.primary};
          color: ${theme.colors.text.primary};
          
          &:hover:not(:disabled) {
            background-color: ${theme.colors.button.primaryHover};
          }
        `;
      case 'transparent':
        return `
          background-color: transparent;
          color: ${theme.colors.text.primary};
          
          &:hover:not(:disabled) {
            background-color: ${theme.colors.ui.hover};
          }
        `;
      case 'glass':
        return `
          background-color: ${theme.colors.glass.background};
          backdrop-filter: blur(${theme.colors.glass.blur});
          -webkit-backdrop-filter: blur(${theme.colors.glass.blur});
          border: 1px solid ${theme.colors.glass.border};
          color: ${theme.colors.text.primary};
          
          &:hover:not(:disabled) {
            background-color: rgba(255, 255, 255, 0.1);
            border-color: rgba(255, 255, 255, 0.2);
          }
        `;
      case 'default':
      default:
        return `
          background-color: ${theme.colors.button.secondary};
          color: ${theme.colors.text.primary};
          
          &:hover:not(:disabled) {
            background-color: ${theme.colors.button.secondaryHover};
          }
        `;
    }
  }}
  
  /* Active state */
  ${props => props.isActive && `
    background-color: ${theme.colors.ui.active};
    color: ${theme.colors.ui.accent};
  `}
  
  /* Disabled state */
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  &:active:not(:disabled) {
    transform: translateY(1px);
  }
`;

export const IconButton: React.FC<IconButtonProps> = ({
  children,
  size = 'md',
  variant = 'default',
  isActive = false,
  ...props
}) => {
  return (
    <StyledIconButton
      size={size}
      variant={variant}
      isActive={isActive}
      {...props}
    >
      {children}
    </StyledIconButton>
  );
};

export default IconButton;
