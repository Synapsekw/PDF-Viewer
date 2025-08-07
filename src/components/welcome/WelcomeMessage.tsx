import React, { useRef } from 'react';
import styled from '@emotion/styled';
import { FiUpload } from 'react-icons/fi';

const WelcomeContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 2rem;
  text-align: center;
`;

const WelcomeContent = styled.div`
  backdrop-blur-2xl;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 1rem;
  padding: 2rem;
  max-width: 300px;
  text-align: center;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
`;

const IconWrapper = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
  color: rgba(255, 255, 255, 0.8);
  font-size: 2rem;
`;

const Title = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: white;
  margin-bottom: 0.5rem;
  letter-spacing: -0.025em;
`;

const Description = styled.p`
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.875rem;
  line-height: 1.5;
  margin-bottom: 1rem;
`;

const UploadHint = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.75rem;
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.15);
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.12);
    color: rgba(255, 255, 255, 0.8);
    border-color: rgba(255, 255, 255, 0.25);
    transform: translateY(-1px);
  }
`;

const HiddenFileInput = styled.input`
  display: none;
`;

interface WelcomeMessageProps {
  onFileUpload?: (file: File) => void;
}

export const WelcomeMessage: React.FC<WelcomeMessageProps> = ({ onFileUpload }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onFileUpload) {
      onFileUpload(file);
    }
  };

  return (
    <WelcomeContainer>
      <WelcomeContent>
        <IconWrapper>
          <FiUpload />
        </IconWrapper>
        <Title>Upload a PDF</Title>
        <Description>
          Select a PDF file to begin viewing and analyzing with AI assistance
        </Description>
        <UploadHint onClick={handleUploadClick}>
          <FiUpload size={12} />
          Click here to upload a PDF
        </UploadHint>
        <HiddenFileInput
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
        />
      </WelcomeContent>
    </WelcomeContainer>
  );
};

export default WelcomeMessage;
