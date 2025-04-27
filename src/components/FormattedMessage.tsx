// src/components/FormattedMessage.tsx
import React from 'react';
import { formatOpenAIResponse } from '@/utils/formatters';

interface FormattedMessageProps {
  content: string;
  className?: string;
}

export const FormattedMessage: React.FC<FormattedMessageProps> = ({ content, className = '' }) => {
  const formattedContent = formatOpenAIResponse(content);
  
  return (
    <div 
      className={`formatted-message ${className}`}
      dangerouslySetInnerHTML={{ __html: formattedContent }}
    />
  );
};