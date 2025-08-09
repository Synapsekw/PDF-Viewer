import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from '@emotion/styled';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { FaGoogle, FaApple } from 'react-icons/fa';
import { MdEmail, MdLock, MdArrowBack } from 'react-icons/md';
import { SupabaseClientManager } from '../../lib/supabase/client';
import { repositoryManager } from '../../lib/repositories/RepositoryManager';
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
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [useSupabaseAuth, setUseSupabaseAuth] = useState(false);

  // Check if Supabase is available on mount
  useEffect(() => {
    const supabase = SupabaseClientManager.getClient();
    if (supabase) {
      setUseSupabaseAuth(true);
      
      // Check if user is already logged in
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          navigate('/dashboard');
        }
      });

      // Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session) {
          // Initialize repositories in Supabase mode
          repositoryManager.configure({ mode: 'supabase' });
          navigate('/dashboard');
        }
      });

      return () => subscription.unsubscribe();
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    if (!useSupabaseAuth) {
      // Development mode - skip auth
      setTimeout(() => {
        setIsLoading(false);
        repositoryManager.configure({ mode: 'local' });
        navigate('/dashboard');
      }, 500);
      return;
    }

    try {
      const supabase = SupabaseClientManager.getClient();
      if (!supabase) {
        throw new Error('Supabase client not available');
      }

      let result;
      if (mode === 'signin') {
        result = await supabase.auth.signInWithPassword({
          email,
          password
        });
      } else {
        result = await supabase.auth.signUp({
          email,
          password
        });
      }

      if (result.error) {
        throw result.error;
      }

      if (mode === 'signup' && !result.data.session) {
        setError('Please check your email for verification link');
      }

    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    if (!useSupabaseAuth) {
      navigate('/dashboard');
      return;
    }

    try {
      const supabase = SupabaseClientManager.getClient();
      if (!supabase) {
        throw new Error('Supabase client not available');
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });

      if (error) {
        setError(error.message);
      }
    } catch (err: any) {
      setError(err.message || 'Google authentication failed');
    }
  };

  const handleAppleAuth = async () => {
    if (!useSupabaseAuth) {
      navigate('/dashboard');
      return;
    }

    try {
      const supabase = SupabaseClientManager.getClient();
      if (!supabase) {
        throw new Error('Supabase client not available');
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });

      if (error) {
        setError(error.message);
      }
    } catch (err: any) {
      setError(err.message || 'Apple authentication failed');
    }
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
          <Title>{mode === 'signin' ? 'Welcome Back' : 'Create Account'}</Title>
          <Subtitle>
            {mode === 'signin' 
              ? (useSupabaseAuth ? 'Sign in to continue' : 'Continue to PDF viewer') 
              : 'Join Spectra to get started'
            }
          </Subtitle>
          {!useSupabaseAuth && (
            <div style={{ marginTop: '8px', padding: '4px 8px', background: 'rgba(255, 193, 7, 0.1)', border: '1px solid rgba(255, 193, 7, 0.3)', borderRadius: '4px' }}>
              <p style={{ fontSize: '12px', color: '#ffc107', margin: 0 }}>
                Development Mode - No authentication required
              </p>
            </div>
          )}
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

          {error && (
            <div style={{ 
              padding: '12px', 
              background: 'rgba(239, 68, 68, 0.1)', 
              border: '1px solid rgba(239, 68, 68, 0.3)', 
              borderRadius: '8px',
              color: '#ef4444',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            fullWidth
            disabled={isLoading}
          >
            {isLoading 
              ? (mode === 'signin' ? 'Signing in...' : 'Creating account...') 
              : (mode === 'signin' ? 'Sign In' : 'Create Account')
            }
          </Button>

          {useSupabaseAuth && (
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <button
                type="button"
                onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: theme.colors.text.secondary,
                  fontSize: theme.typography.fontSize.sm,
                  textDecoration: 'underline',
                  cursor: 'pointer'
                }}
              >
                {mode === 'signin' 
                  ? "Don't have an account? Sign up" 
                  : "Already have an account? Sign in"
                }
              </button>
            </div>
          )}
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
