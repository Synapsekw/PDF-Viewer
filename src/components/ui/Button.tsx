import React, { ButtonHTMLAttributes } from 'react';
import styled from '@emotion/styled';
import theme from '../../theme';

type ButtonVariant = 'primary' | 'secondary' | 'text' | 'icon' | 'glass';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isActive?: boolean;
  fullWidth?: boolean;
}

const StyledButton = styled.button<ButtonProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: ${theme.borderRadius.md};
  font-weight: ${theme.typography.fontWeight.medium};
  transition: ${theme.transitions.default};
  white-space: nowrap;
  
  /* Size styles */
  ${props => {
    switch (props.size) {
      case 'sm':
        return `
          padding: ${theme.spacing[1]} ${theme.spacing[2]};
          font-size: ${theme.typography.fontSize.sm};
        `;
      case 'lg':
        return `
          padding: ${theme.spacing[3]} ${theme.spacing[6]};
          font-size: ${theme.typography.fontSize.lg};
        `;
      case 'md':
      default:
        return `
          padding: ${theme.spacing[2]} ${theme.spacing[4]};
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
          
          &:active:not(:disabled) {
            transform: translateY(1px);
          }
        `;
      case 'secondary':
        return `
          background-color: ${theme.colors.button.secondary};
          color: ${theme.colors.text.primary};
          
          &:hover:not(:disabled) {
            background-color: ${theme.colors.button.secondaryHover};
          }
          
          &:active:not(:disabled) {
            transform: translateY(1px);
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
          
          &:active:not(:disabled) {
            transform: translateY(1px);
          }
        `;
      case 'text':
        return `
          background-color: transparent;
          color: ${theme.colors.text.primary};
          padding-left: ${theme.spacing[2]};
          padding-right: ${theme.spacing[2]};
          
          &:hover:not(:disabled) {
            background-color: ${theme.colors.ui.hover};
          }
        `;
      case 'icon':
        return `
          background-color: transparent;
          color: ${theme.colors.text.primary};
          padding: ${theme.spacing[2]};
          border-radius: ${theme.borderRadius.md};
          
          &:hover:not(:disabled) {
            background-color: ${theme.colors.ui.hover};
          }
        `;
      default:
        return '';
    }
  }}
  
  /* Active state */
  ${props => props.isActive && `
    background-color: ${theme.colors.ui.active};
    color: ${theme.colors.ui.accent};
  `}
  
  /* Full width */
  ${props => props.fullWidth && `
    width: 100%;
  `}
  
  /* Disabled state */
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'secondary',
  size = 'md',
  isActive = false,
  fullWidth = false,
  ...props
}) => {
  return (
    <StyledButton
      variant={variant}
      size={size}
      isActive={isActive}
      fullWidth={fullWidth}
      {...props}
    >
      {children}
    </StyledButton>
  );
};

export default Button;
