import React, { InputHTMLAttributes } from 'react';
import styled from '@emotion/styled';
import theme from '../../theme';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const InputContainer = styled.div<{ fullWidth?: boolean }>`
  position: relative;
  display: inline-flex;
  align-items: center;
  width: ${props => props.fullWidth ? '100%' : 'auto'};
`;

const StyledInput = styled.input<InputProps>`
  background-color: ${theme.colors.background.secondary};
  color: ${theme.colors.text.primary};
  border: 1px solid ${theme.colors.ui.border};
  border-radius: ${theme.borderRadius.md};
  font-family: ${theme.typography.fontFamily};
  width: 100%;
  transition: ${theme.transitions.default};
  
  &:focus {
    outline: none;
    border-color: ${theme.colors.ui.accent};
    box-shadow: 0 0 0 1px ${theme.colors.ui.accent};
  }
  
  &::placeholder {
    color: ${theme.colors.text.disabled};
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  /* Size styles */
  ${props => {
    switch (props.size) {
      case 'sm':
        return `
          padding: ${theme.spacing[1]} ${theme.spacing[2]};
          font-size: ${theme.typography.fontSize.sm};
          ${props.leftIcon ? `padding-left: ${theme.spacing[6]};` : ''}
          ${props.rightIcon ? `padding-right: ${theme.spacing[6]};` : ''}
        `;
      case 'lg':
        return `
          padding: ${theme.spacing[3]} ${theme.spacing[4]};
          font-size: ${theme.typography.fontSize.lg};
          ${props.leftIcon ? `padding-left: ${theme.spacing[10]};` : ''}
          ${props.rightIcon ? `padding-right: ${theme.spacing[10]};` : ''}
        `;
      case 'md':
      default:
        return `
          padding: ${theme.spacing[2]} ${theme.spacing[3]};
          font-size: ${theme.typography.fontSize.md};
          ${props.leftIcon ? `padding-left: ${theme.spacing[8]};` : ''}
          ${props.rightIcon ? `padding-right: ${theme.spacing[8]};` : ''}
        `;
    }
  }}
`;

const IconWrapper = styled.div<{ position: 'left' | 'right', size?: 'sm' | 'md' | 'lg' }>`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${theme.colors.text.secondary};
  pointer-events: none;
  
  ${props => {
    if (props.position === 'left') {
      switch (props.size) {
        case 'sm': return `left: ${theme.spacing[2]};`;
        case 'lg': return `left: ${theme.spacing[4]};`;
        case 'md':
        default: return `left: ${theme.spacing[3]};`;
      }
    } else {
      switch (props.size) {
        case 'sm': return `right: ${theme.spacing[2]};`;
        case 'lg': return `right: ${theme.spacing[4]};`;
        case 'md':
        default: return `right: ${theme.spacing[3]};`;
      }
    }
  }}
`;

export const Input: React.FC<InputProps> = ({
  size = 'md',
  fullWidth = false,
  leftIcon,
  rightIcon,
  ...props
}) => {
  return (
    <InputContainer fullWidth={fullWidth}>
      {leftIcon && (
        <IconWrapper position="left" size={size}>
          {leftIcon}
        </IconWrapper>
      )}
      <StyledInput
        size={size}
        fullWidth={fullWidth}
        leftIcon={leftIcon}
        rightIcon={rightIcon}
        {...props}
      />
      {rightIcon && (
        <IconWrapper position="right" size={size}>
          {rightIcon}
        </IconWrapper>
      )}
    </InputContainer>
  );
};

export default Input;
