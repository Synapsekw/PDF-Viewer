import React from 'react';
import styled from '@emotion/styled';
import { Card } from '../ui';
import theme from '../../theme';
import { FiX } from 'react-icons/fi';
import Settings from './Settings';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: ${theme.zIndices.modal};
  padding: ${theme.spacing[4]};
`;

const ModalContent = styled(Card)`
  width: 500px;
  max-width: 90vw;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
`;

const CloseButton = styled.button`
  position: absolute;
  top: ${theme.spacing[3]};
  right: ${theme.spacing[3]};
  background: none;
  border: none;
  cursor: pointer;
  color: ${theme.colors.text.secondary};
  font-size: ${theme.typography.fontSize.lg};
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${theme.spacing[1]};
  border-radius: ${theme.borderRadius.full};
  transition: ${theme.transitions.default};
  
  &:hover {
    background-color: ${theme.colors.ui.hover};
    color: ${theme.colors.text.primary};
  }
`;

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  
  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent 
        onClick={(e) => e.stopPropagation()}
        variant="elevated"
        padding="none"
      >
        <CloseButton onClick={onClose} aria-label="Close settings">
          <FiX />
        </CloseButton>
        <Settings onClose={onClose} />
      </ModalContent>
    </ModalOverlay>
  );
};

export default SettingsModal;
