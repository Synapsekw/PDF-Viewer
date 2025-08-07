import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from '@emotion/styled';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { FaGoogle, FaApple } from 'react-icons/fa';
import { MdEmail, MdLock, MdArrowBack } from 'react-icons/md';
import theme from '../../theme';

const AuthContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${theme.spacing[4]};
  font-family: ${theme.typography.fontFamily};
  position: relative;
  
  /* Background gradient overlay with blur effect - matches landing page exactly */
  &::before {
    content: '';
    position: fixed;
    inset: 0;
    background: linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.95) 50%, rgba(15, 23, 42, 0.9) 100%);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    pointer-events: none;
  }
`;

const AuthCard = styled(Card)`
  width: 100%;
  max-width: 400px;
  background: ${theme.colors.glass.background};
  backdrop-filter: blur(${theme.colors.glass.blur});
  -webkit-backdrop-filter: blur(${theme.colors.glass.blur});
  border: 1px solid ${theme.colors.glass.border};
  box-shadow: ${theme.shadows.lg};
  padding: ${theme.spacing[8]};
  animation: fadeInUp 0.6s ease-out;
  
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const AuthHeader = styled.div`
  text-align: center;
  margin-bottom: ${theme.spacing[8]};
`;

const Logo = styled.img`
  width: 80px;
  height: 80px;
  margin: 0 auto ${theme.spacing[4]};
  filter: brightness(0) invert(1);
`;

const Title = styled.h1`
  color: ${theme.colors.text.primary};
  font-size: ${theme.typography.fontSize['2xl']};
  font-weight: ${theme.typography.fontWeight.bold};
  margin-bottom: ${theme.spacing[2]};
`;

const Subtitle = styled.p`
  color: ${theme.colors.text.secondary};
  font-size: ${theme.typography.fontSize.md};
  margin: 0;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing[4]};
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing[2]};
`;

const Label = styled.label`
  color: ${theme.colors.text.primary};
  font-size: ${theme.typography.fontSize.sm};
  font-weight: ${theme.typography.fontWeight.medium};
`;

const SocialLoginSection = styled.div`
  margin-top: ${theme.spacing[6]};
  text-align: center;
`;

const Divider = styled.div`
  display: flex;
  align-items: center;
  margin: ${theme.spacing[4]} 0;
  color: ${theme.colors.text.secondary};
  font-size: ${theme.typography.fontSize.sm};
  
  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: ${theme.colors.ui.border};
  }
  
  &::before {
    margin-right: ${theme.spacing[3]};
  }
  
  &::after {
    margin-left: ${theme.spacing[3]};
  }
`;

const SocialButtons = styled.div`
  display: flex;
  gap: ${theme.spacing[3]};
  margin-top: ${theme.spacing[4]};
`;

const SocialButton = styled(Button)`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${theme.spacing[2]};
  background: ${theme.colors.glass.background};
  border: 1px solid ${theme.colors.glass.border};
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
  }
`;

const BackButton = styled(Button)`
  position: fixed;
  top: ${theme.spacing[4]};
  left: ${theme.spacing[4]};
  background: ${theme.colors.glass.background};
  border: 1px solid ${theme.colors.glass.border};
  color: ${theme.colors.text.primary};
  z-index: 20;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
  }
`;

const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // For development: immediately navigate to app regardless of credentials
    setTimeout(() => {
      setIsLoading(false);
      navigate('/app');
    }, 500); // Reduced delay for faster development
  };

  const handleGoogleAuth = () => {
    // For development: immediately navigate to app
    navigate('/app');
  };

  const handleAppleAuth = () => {
    // For development: immediately navigate to app
    navigate('/app');
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  return (
    <AuthContainer>
      <BackButton
        variant="glass"
        onClick={handleBackToHome}
        type="button"
      >
        <MdArrowBack />
        Back
      </BackButton>
      
      {/* Main content centered with proper z-index */}
      <div className="relative z-10 flex items-center justify-center min-h-screen w-full">
        <AuthCard>
        <AuthHeader>
          <Logo src="/Spectra.png" alt="Spectra Logo" />
          <Title>Welcome Back</Title>
          <Subtitle>Sign in to continue to your PDF viewer</Subtitle>
        </AuthHeader>

        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<MdEmail />}
              fullWidth
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<MdLock />}
              fullWidth
            />
          </FormGroup>

          <Button
            type="submit"
            variant="primary"
            fullWidth
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>
        </Form>

        <SocialLoginSection>
          <Divider>or continue with</Divider>
          
          <SocialButtons>
            <SocialButton
              variant="glass"
              onClick={handleGoogleAuth}
              type="button"
            >
              <FaGoogle />
              Google
            </SocialButton>
            
            <SocialButton
              variant="glass"
              onClick={handleAppleAuth}
              type="button"
            >
              <FaApple />
              Apple
            </SocialButton>
          </SocialButtons>
        </SocialLoginSection>
        </AuthCard>
      </div>
    </AuthContainer>
  );
};

export default AuthPage;
