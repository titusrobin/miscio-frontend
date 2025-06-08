// src/components/DynamicLoadingIndicator.tsx
import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

interface DynamicLoadingIndicatorProps {
  messages: string[];
  isVisible: boolean;
  onComplete?: () => void;
}

export const DynamicLoadingIndicator: React.FC<DynamicLoadingIndicatorProps> = ({
  messages,
  isVisible,
  onComplete
}) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [displayedMessage, setDisplayedMessage] = useState('');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Reset when visibility changes
  useEffect(() => {
    if (isVisible) {
      setCurrentMessageIndex(0);
      setDisplayedMessage(messages[0] || 'Processing...');
    } else {
      // Clean up when hidden
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (onComplete) {
        onComplete();
      }
    }
  }, [isVisible, messages, onComplete]);

  // Rotate through messages
  useEffect(() => {
    if (!isVisible || messages.length === 0) return;

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Set up message rotation
    intervalRef.current = setInterval(() => {
      setCurrentMessageIndex(prevIndex => {
        const nextIndex = (prevIndex + 1) % messages.length;
        setDisplayedMessage(messages[nextIndex]);
        return nextIndex;
      });
    }, 3500); // Change message every 3.5 seconds

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isVisible, messages]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="flex justify-start items-center my-4 space-x-4">
      {/* Your existing loading animation */}
      <div className="flex-shrink-0">
        <Image
          src="/images/miscioload2.gif"  
          alt="Loading..."
          width={40}
          height={40}
          className="object-contain"
        />
      </div>
      
      {/* Dynamic status messages */}
      <div className="flex-1">
        <div className="text-sm text-gray-600 min-h-[20px] transition-opacity duration-300">
          {displayedMessage}
        </div>
        
        {/* Optional progress indicator */}
        <div className="text-xs text-gray-400 mt-1">
          {messages.length > 0 && (
            <span>{currentMessageIndex + 1} of {messages.length} operations</span>
          )}
        </div>
      </div>
    </div>
  );
};