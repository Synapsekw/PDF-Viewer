import React, { useState, useRef, useEffect } from 'react';
import styled from '@emotion/styled';
import { Button, Card, Input } from '../ui';
import theme from '../../theme';
import { FiSend } from 'react-icons/fi';

const AssistantContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: ${theme.spacing[4]};
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

const ChatContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  margin-bottom: ${theme.spacing[4]};
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing[4]};
  padding-right: ${theme.spacing[2]};
  
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

interface Message {
  id: string;
  text: string;
  isUser: boolean;
}

export const AIAssistant: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! How can I assist you today?',
      isUser: false
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      isUser: true
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    
    // Simulate AI response (in a real app, this would be an API call)
    setTimeout(() => {
      // This is just a placeholder - in a real app, you'd call an AI API
      const aiResponses: { [key: string]: string } = {
        'What is the main topic of this document?': 'This document appears to be a sample PDF with lorem ipsum placeholder text.',
        'Can you summarize this document?': 'The document contains placeholder text (lorem ipsum) commonly used in design and publishing. It doesn\'t contain meaningful content to summarize.',
        'help': 'I can help you understand the content of this PDF, answer questions about it, or assist with navigation. Just ask me anything about the document!'
      };
      
      // Check if we have a predefined response, otherwise use a default
      let responseText = aiResponses[inputValue] || 
        'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Vestibulum varius, quam et turpis faucibus tincidunt.';
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        isUser: false
      };
      
      setMessages(prev => [...prev, aiMessage]);
    }, 1000);
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
      </AssistantHeader>
      
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
      </ChatContainer>
      
      <InputContainer variant="glass">
        <StyledInput
          placeholder="Ask anything about this..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <SendButton 
          variant="primary" 
          onClick={handleSendMessage}
          disabled={!inputValue.trim()}
          aria-label="Send message"
        >
          <FiSend />
        </SendButton>
      </InputContainer>
    </AssistantContainer>
  );
};

export default AIAssistant;
