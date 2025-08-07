import React from 'react';
import styled from '@emotion/styled';
import { Button, Card } from '../ui';
import theme from '../../theme';
import { useTheme } from '../../theme/ThemeProvider';

const SettingsContainer = styled.div`
  padding: ${theme.spacing[4]};
`;

const SettingsHeader = styled.div`
  margin-bottom: ${theme.spacing[6]};
`;

const Title = styled.h2`
  font-size: ${theme.typography.fontSize.xl};
  font-weight: ${theme.typography.fontWeight.semibold};
  color: ${theme.colors.text.primary};
  margin-bottom: ${theme.spacing[2]};
`;

const Description = styled.p`
  color: ${theme.colors.text.secondary};
  font-size: ${theme.typography.fontSize.md};
`;

const Section = styled.section`
  margin-bottom: ${theme.spacing[6]};
`;

const SectionTitle = styled.h3`
  font-size: ${theme.typography.fontSize.lg};
  font-weight: ${theme.typography.fontWeight.medium};
  color: ${theme.colors.text.primary};
  margin-bottom: ${theme.spacing[3]};
`;

const OptionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${theme.spacing[3]};
`;

const BackgroundOption = styled.div<{ isSelected: boolean }>`
  position: relative;
  cursor: pointer;
  border-radius: ${theme.borderRadius.md};
  overflow: hidden;
  border: 2px solid ${props => props.isSelected ? theme.colors.ui.accent : 'transparent'};
  transition: ${theme.transitions.default};
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${theme.shadows.md};
  }
`;

const BackgroundPreview = styled.div<{ variant: string }>`
  height: 100px;
  width: 100%;
  
  ${props => {
    switch (props.variant) {
      case 'gradient1':
        return `
          background: radial-gradient(circle at top left, rgba(41, 61, 88, 0.8), rgba(28, 39, 51, 0.95));
        `;
      case 'gradient2':
        return `
          background: linear-gradient(135deg, rgba(41, 61, 88, 0.8), rgba(28, 39, 51, 0.95));
        `;
      case 'solid':
        return `
          background-color: ${theme.colors.background.primary};
        `;
      case 'default':
      default:
        return `
          background-color: ${theme.colors.background.primary};
        `;
    }
  }}
`;

const OptionLabel = styled.div`
  padding: ${theme.spacing[2]};
  text-align: center;
  font-size: ${theme.typography.fontSize.sm};
  color: ${theme.colors.text.primary};
  background-color: ${theme.colors.background.tertiary};
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: ${theme.spacing[6]};
`;

interface SettingsProps {
  onClose: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ onClose }) => {
  const { backgroundVariant, setBackgroundVariant } = useTheme();
  
  const handleBackgroundChange = (variant: 'default' | 'gradient1' | 'gradient2' | 'solid') => {
    setBackgroundVariant(variant);
  };
  
  return (
    <SettingsContainer>
      <SettingsHeader>
        <Title>Settings</Title>
        <Description>Customize your PDF viewing experience</Description>
      </SettingsHeader>
      
      <Section>
        <SectionTitle>Background</SectionTitle>
        <OptionGrid>
          <BackgroundOption 
            isSelected={backgroundVariant === 'default'}
            onClick={() => handleBackgroundChange('default')}
          >
            <BackgroundPreview variant="default" />
            <OptionLabel>Default</OptionLabel>
          </BackgroundOption>
          
          <BackgroundOption 
            isSelected={backgroundVariant === 'gradient1'}
            onClick={() => handleBackgroundChange('gradient1')}
          >
            <BackgroundPreview variant="gradient1" />
            <OptionLabel>Radial Gradient</OptionLabel>
          </BackgroundOption>
          
          <BackgroundOption 
            isSelected={backgroundVariant === 'gradient2'}
            onClick={() => handleBackgroundChange('gradient2')}
          >
            <BackgroundPreview variant="gradient2" />
            <OptionLabel>Linear Gradient</OptionLabel>
          </BackgroundOption>
          
          <BackgroundOption 
            isSelected={backgroundVariant === 'solid'}
            onClick={() => handleBackgroundChange('solid')}
          >
            <BackgroundPreview variant="solid" />
            <OptionLabel>Solid</OptionLabel>
          </BackgroundOption>
        </OptionGrid>
      </Section>
      
      <ButtonContainer>
        <Button variant="primary" onClick={onClose}>
          Done
        </Button>
      </ButtonContainer>
    </SettingsContainer>
  );
};

export default Settings;
