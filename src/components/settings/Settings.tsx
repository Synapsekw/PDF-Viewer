import React from 'react';
import styled from '@emotion/styled';
import { Button, Card } from '../ui';
import theme from '../../theme';
import { useTheme } from '../../theme/ThemeProvider';

// Color theme preview components
const ColorThemePreview = styled.div<{ theme: string }>`
  height: 60px;
  width: 100%;
  border-radius: ${theme.borderRadius.md};
  position: relative;
  overflow: hidden;
  
  ${props => {
    const getGradient = (themeName: string) => {
      switch (themeName) {
        case 'slate':
          return 'linear-gradient(135deg, #020617, #1e293b, #475569, #1e293b, #020617)';
        case 'green':
          return 'linear-gradient(135deg, #022c22, #065f46, #059669, #065f46, #022c22)';
        case 'blue':
          return 'linear-gradient(135deg, #172554, #1e40af, #2563eb, #1e40af, #172554)';
        case 'purple':
          return 'linear-gradient(135deg, #2e1065, #7c3aed, #a855f7, #7c3aed, #2e1065)';
        case 'pink':
          return 'linear-gradient(135deg, #500724, #be185d, #ec4899, #be185d, #500724)';
        case 'yellow':
          return 'linear-gradient(135deg, #451a03, #92400e, #d97706, #92400e, #451a03)';
        default:
          return 'linear-gradient(135deg, #020617, #1e293b, #475569, #1e293b, #020617)';
      }
    };
    
    return `
      background: ${getGradient(props.theme)};
      &::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%);
      }
    `;
  }}
`;

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
  const { backgroundVariant, setBackgroundVariant, colorTheme, setColorTheme } = useTheme();
  
  const handleBackgroundChange = (variant: 'default' | 'gradient1' | 'gradient2' | 'solid') => {
    setBackgroundVariant(variant);
  };

  const handleColorThemeChange = (theme: 'slate' | 'green' | 'blue' | 'purple' | 'pink' | 'yellow') => {
    setColorTheme(theme);
  };
  
  return (
    <SettingsContainer>
      <SettingsHeader>
        <Title>Settings</Title>
        <Description>Customize your PDF viewing experience</Description>
      </SettingsHeader>
      
      <Section>
        <SectionTitle>Color Theme</SectionTitle>
        <OptionGrid>
          {(['slate', 'green', 'blue', 'purple', 'pink', 'yellow'] as const).map((theme) => (
            <BackgroundOption 
              key={theme}
              isSelected={colorTheme === theme}
              onClick={() => handleColorThemeChange(theme)}
            >
              <ColorThemePreview theme={theme} />
              <OptionLabel style={{ textTransform: 'capitalize' }}>{theme}</OptionLabel>
            </BackgroundOption>
          ))}
        </OptionGrid>
      </Section>
      
      <Section>
        <SectionTitle>Background Style</SectionTitle>
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
