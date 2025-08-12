import React, { useState, useRef, useEffect } from 'react';
import styled from '@emotion/styled';
import { Button, Card, Input } from '../ui';
import theme from '../../theme';
import { FiSend, FiAlertCircle } from 'react-icons/fi';
import { openAIService } from '../../services/OpenAIService';
import { usePdf } from '../../pdf/PdfContext';

const AssistantContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: ${theme.spacing[4]};
  min-height: 0;
`;

const AssistantHeader = styled.div`
  margin-bottom: ${theme.spacing[4]};
`;

const Title = styled.h2`
  font-size: ${theme.typography.fontSize.xl};
  font-weight: ${theme.typography.fontWeight.semibold};
  color: ${theme.colors.text.primary};
  margin-bottom: ${theme.spacing[2]};
`;

const StatusIndicator = styled.div<{ isConfigured: boolean }>`
  display: flex;
  align-items: center;
  gap: ${theme.spacing[2]};
  font-size: ${theme.typography.fontSize.sm};
  color: ${props => props.isConfigured ? theme.colors.ui.success : theme.colors.ui.error};
  margin-bottom: ${theme.spacing[2]};
`;

const ChatContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  margin-bottom: ${theme.spacing[4]};
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing[4]};
  padding-right: ${theme.spacing[2]};
  min-height: 0;
  
  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: ${theme.colors.glass.border};
    border-radius: ${theme.borderRadius.full};
  }
`;

const MessageBubble = styled(Card)<{ isUser: boolean }>`
  max-width: 85%;
  align-self: ${props => props.isUser ? 'flex-end' : 'flex-start'};
  background-color: ${props => props.isUser ? theme.colors.ui.accent : theme.colors.glass.background};
  backdrop-filter: ${props => !props.isUser ? `blur(${theme.colors.glass.blur})` : 'none'};
  -webkit-backdrop-filter: ${props => !props.isUser ? `blur(${theme.colors.glass.blur})` : 'none'};
  border: ${props => !props.isUser ? `1px solid ${theme.colors.glass.border}` : 'none'};
  color: ${theme.colors.text.primary};
  border-radius: ${props => props.isUser 
    ? `${theme.borderRadius.lg} ${theme.borderRadius.lg} 0 ${theme.borderRadius.lg}` 
    : `0 ${theme.borderRadius.lg} ${theme.borderRadius.lg} ${theme.borderRadius.lg}`};
`;

const InputContainer = styled(Card)`
  position: relative;
  display: flex;
  padding: ${theme.spacing[1]};
  border-radius: ${theme.borderRadius.full};
  flex-shrink: 0;
`;

const StyledInput = styled.input`
  flex: 1;
  background-color: transparent;
  border: none;
  color: ${theme.colors.text.primary};
  font-size: ${theme.typography.fontSize.md};
  padding: ${theme.spacing[2]} ${theme.spacing[3]};
  
  &:focus {
    outline: none;
  }
  
  &::placeholder {
    color: ${theme.colors.text.secondary};
  }
`;

const SendButton = styled(Button)`
  padding: ${theme.spacing[2]};
  min-width: unset;
  border-radius: ${theme.borderRadius.full};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const LoadingIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing[2]};
  color: ${theme.colors.text.secondary};
  font-size: ${theme.typography.fontSize.sm};
`;

const ErrorMessage = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing[2]};
  color: ${theme.colors.ui.error};
  font-size: ${theme.typography.fontSize.sm};
  padding: ${theme.spacing[2]};
  background-color: ${theme.colors.ui.error}20;
  border-radius: ${theme.borderRadius.md};
  margin-bottom: ${theme.spacing[2]};
`;

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export const AIAssistant: React.FC = () => {
  console.log('🎯 AIAssistant: Component rendering');
  
  const { document, documentMeta } = usePdf();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I\'m your AI assistant. I can help you analyze and understand your PDF documents. Ask me anything about the current document!',
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const isConfigured = openAIService.isConfigured();

  // Debug OpenAI configuration
  useEffect(() => {
    console.log('AIAssistant: Component mounted');
    console.log('AIAssistant: OpenAI API Key exists:', !!import.meta.env.VITE_OPENAI_API_KEY);
    console.log('AIAssistant: OpenAI API Key length:', import.meta.env.VITE_OPENAI_API_KEY?.length);
    console.log('AIAssistant: isConfigured:', isConfigured);
    
    // Test the API key if configured
    if (isConfigured) {
      openAIService.testAPIKey().then(isValid => {
        console.log('AIAssistant: API key test result:', isValid);
        if (!isValid) {
          setError('OpenAI API key is invalid. Please check your configuration.');
        }
      });
    }
  }, [isConfigured]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    console.log('AIAssistant: handleSendMessage called');
    console.log('AIAssistant: inputValue:', inputValue);
    console.log('AIAssistant: isLoading:', isLoading);
    console.log('AIAssistant: isConfigured:', isConfigured);
    
    if (!inputValue.trim() || isLoading) {
      console.log('AIAssistant: Early return - input empty or loading');
      return;
    }
    
    console.log('AIAssistant: Proceeding with message send');
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      isUser: true,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);
    
    try {
      // Convert conversation history to OpenAI format
      const conversationHistory = messages
        .filter(msg => msg.id !== '1') // Exclude initial greeting
        .map(msg => ({
          role: msg.isUser ? 'user' as const : 'assistant' as const,
          content: msg.text
        }));

      // Create system prompt based on current document
      const systemPrompt = openAIService.createPDFSystemPrompt(
        documentMeta?.name || document?.title || 'Current PDF Document'
      );

      console.log('AIAssistant: Sending message to OpenAI:', inputValue);
      
      const response = await openAIService.sendMessage(
        inputValue,
        conversationHistory,
        systemPrompt,
        {
          id: documentMeta?.id || document?.id,
          title: documentMeta?.name || document?.title
        }
      );
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        isUser: false,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
      console.log('AIAssistant: Received response from OpenAI');
      
    } catch (error) {
      console.error('AIAssistant: Error calling OpenAI:', error);
      setError(error instanceof Error ? error.message : 'Failed to get AI response');
      
      // Add error message to chat
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I encountered an error while processing your request. Please try again.',
        isUser: false,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <AssistantContainer>
      <AssistantHeader>
        <Title>AI Assistant</Title>
        <StatusIndicator isConfigured={isConfigured}>
          {isConfigured ? (
            <>
              <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: theme.colors.ui.success }} />
              Connected to OpenAI
            </>
          ) : (
            <>
              <FiAlertCircle size={16} />
              OpenAI API not configured
            </>
          )}
        </StatusIndicator>
      </AssistantHeader>
      
      {error && (
        <ErrorMessage>
          <FiAlertCircle size={16} />
          {error}
        </ErrorMessage>
      )}
      
      <ChatContainer ref={chatContainerRef}>
        {messages.map(message => (
          <MessageBubble 
            key={message.id} 
            isUser={message.isUser}
            padding="md"
            variant={message.isUser ? 'default' : 'glass'}
          >
            {message.text}
          </MessageBubble>
        ))}
        
        {isLoading && (
          <MessageBubble 
            isUser={false}
            padding="md"
            variant="glass"
          >
            <LoadingIndicator>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400" />
              Thinking...
            </LoadingIndicator>
          </MessageBubble>
        )}
      </ChatContainer>
      
      <InputContainer variant="glass">
        <StyledInput
          placeholder={isConfigured ? "Ask anything about this document..." : "OpenAI API not configured"}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={!isConfigured || isLoading}
        />
        <SendButton 
          variant="primary" 
          onClick={() => {
            console.log('AIAssistant: Send button clicked');
            console.log('AIAssistant: Button disabled state:', !inputValue.trim() || isLoading || !isConfigured);
            handleSendMessage();
          }}
          disabled={!inputValue.trim() || isLoading || !isConfigured}
          aria-label="Send message"
        >
          <FiSend />
        </SendButton>
      </InputContainer>
    </AssistantContainer>
  );
};

export default AIAssistant;
