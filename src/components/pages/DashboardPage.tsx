// src/components/pages/DashboardPage.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowUp, Plus, FileUp } from 'lucide-react';
import Image from 'next/image';
import { api } from '@/app/services/api';
import { Message, Thread } from '@/types/api';
import { FormattedMessage } from '@/components/FormattedMessage';
import { DynamicLoadingIndicator } from '@/components/DynamicLoadingIndicator';


export default function DashboardPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThread, setActiveThread] = useState<string | null>(null);
  const [titleGenerationTimeout, setTitleGenerationTimeout] = useState<NodeJS.Timeout | null>(null);
  const [loadingMessages, setLoadingMessages] = useState<string[]>([]);
  const [showDynamicLoading, setShowDynamicLoading] = useState(false);

  const uploadSuccessMessages = [
    "Upload complete!",
    "File processed!",
    "Successfully uploaded!"
  ];
  
  // Add new state for file upload
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  
  // Create a ref for the hidden file input
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const loadThreads = useCallback(async () => {
    try {
      const fetchedThreads = await api.getThreads();
      setThreads(fetchedThreads);
      if (fetchedThreads.length > 0 && !activeThread) {
        setActiveThread(fetchedThreads[0].id);
      } else if (fetchedThreads.length === 0) {
        // If no threads exist, create one automatically
        const newThread = await api.createThread();
        setThreads([newThread]);
        setActiveThread(newThread.id);
      }
    } catch (error) {
      console.error('Error loading threads:', error);
      setError('Failed to load threads');
    }
  }, [activeThread]);

  const createNewThread = async () => {
    try {
      const newThread = await api.createThread();
      setThreads(prev => [newThread, ...prev]);
      setActiveThread(newThread.id);
      setMessages([]);
      
    } catch (error) {
      console.error('Error creating thread:', error);
      setError('Failed to create new thread');
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    loadThreads();
  }, []);

  useEffect(() => {
    // Clear any existing timeout when thread changes
    if (titleGenerationTimeout) {
      clearTimeout(titleGenerationTimeout);
    }
  
    // Set up new timeout for the active thread
    if (activeThread) {
      const currentThread = threads.find(t => t.id === activeThread);
      
      // Only set timeout if thread has default name and has messages
      if (currentThread && currentThread.title === 'New Chat' && messages.length > 0) {
        const timeout = setTimeout(async () => {
          try {
            // Generate title after 5 minutes
            const newTitle = await api.generateThreadTitle(messages);
            const truncatedTitle = newTitle.length > 30 ? newTitle.substring(0, 27) + '...' : newTitle;
            
            await api.updateThreadTitle(activeThread, truncatedTitle);
            
            // Update local state
            setThreads(prev => prev.map(thread => 
              thread.id === activeThread 
                ? { ...thread, title: truncatedTitle }
                : thread
            ));
          } catch (error) {
            console.error('Error updating thread title:', error);
          }
        }, 5 * 60 * 1000); // 5 minutes in milliseconds
        
        setTitleGenerationTimeout(timeout);
      }
    }
  
    // Cleanup function
    return () => {
      if (titleGenerationTimeout) {
        clearTimeout(titleGenerationTimeout);
      }
    };
  }, [activeThread, messages, threads]);

  useEffect(() => {
    if (activeThread) {
      loadThreadMessages(activeThread);
    }
  }, [activeThread]);

  const loadThreadMessages = async (threadId: string) => {
    setIsLoadingHistory(true);
    setError(null);
    try {
      const messages = await api.getThreadMessages(threadId);
      setMessages(messages);
    } catch (error) {
      console.error('Error loading messages:', error);
      setError('Failed to load messages');
      setMessages([]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !activeThread || isLoading) return;
  
    const newMessage: Message = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    };
  
    setMessages(prev => [...prev, newMessage]);
    const currentInput = inputMessage; // Store the input
    setInputMessage('');
    setIsLoading(true);
    setError(null);
  
    try {
      // STEP 1: Generate loading messages immediately
      console.log('Generating loading messages for:', currentInput);
      const generatedMessages = await api.generateLoadingMessages(currentInput);
      console.log('Generated messages:', generatedMessages);
      
      setLoadingMessages(generatedMessages);
      setShowDynamicLoading(true);
  
      // STEP 2: Send the actual message (this will take time)
      const response = await api.sendThreadMessage(activeThread, currentInput);
      
      if (response.messages && Array.isArray(response.messages)) {
        const serverMessages = response.messages as Message[];
        setMessages(prev => [
          ...prev.slice(0, prev.length - 1),
          ...serverMessages
        ]);
      } else if (response.response) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: response.response,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, assistantMessage]);
      }
      
      await loadThreads();
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
      setMessages(prev => prev.slice(0, -1));
    } finally {
      // STEP 3: Hide loading when complete
      setIsLoading(false);
      setShowDynamicLoading(false);
      setTimeout(scrollToBottom, 100);
    }
  };
  
  

  // Add a function to handle file selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    setIsUploading(true);
    setError(null);
    setUploadSuccess(null);
    
    try {
      // Optional: You could add a dialog here to ask for vector_store_name
      const vectorStoreName = `${activeThread}-knowledge-base`; // Default name based on thread
      
      await api.uploadFile(file, vectorStoreName);

      // Random success message (max 3 words)
      const randomMessage = uploadSuccessMessages[Math.floor(Math.random() * uploadSuccessMessages.length)];
      setUploadSuccess(randomMessage);

      // Clear message after 2 seconds
      setTimeout(() => {
        setUploadSuccess(null);
      }, 2000);
      
      // Add a system message about the successful upload
      const systemMessage: Message = {
        role: 'assistant',
        content: `File "${file.name}" ready!✅`,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, systemMessage]);
    } catch (error) {
      console.error('Error uploading file:', error);
      setError('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
      // Clear the file input so the same file can be uploaded again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Update the handleFileUpload function to trigger the file input click
  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex h-screen bg-white">
      <div className="w-64 bg-gray-100 flex flex-col border-r border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <Image
              src="/images/misciologo2.png"
              alt="Logo"
              width={102}
              height={72}
              className="rounded-full"
            />
            <button 
              onClick={createNewThread}
              className="p-2 hover:bg-gray-200 rounded-lg text-gray-600"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto py-2">
          {threads.map(thread => (
            <button
              key={thread.id}
              onClick={() => setActiveThread(thread.id)}
              className={`w-full px-4 py-3 text-left transition-colors ${
                activeThread === thread.id 
                  ? 'bg-gray-200' 
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className="text-sm font-medium text-gray-900 truncate">
                {thread.title}
              </div>
              <div className="text-xs text-gray-500 truncate">
                {thread.last_message}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {(() => {
                  const date = new Date(thread.last_activity);
                  // Subtract 5 hours from UTC to get ET
                  date.setHours(date.getHours() - 4);
                  return date.toLocaleString([], {
                    month: 'numeric',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  });
                })()}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoadingHistory ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : error ? (
            <div className="text-red-500 text-center py-4">
              {error}
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                className={`flex items-start space-x-2 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="flex-shrink-0">
                    <Image
                      src="/images/misai.svg"
                      alt="Assistant"
                      width={62}
                      height={62}
                      className="rounded-full w-11 h-11"
                    />
                  </div>
                )}
                <div
                className={`max-w-[70%] px-4 py-2 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-100 text-gray-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {message.role === 'assistant' ? (
                  <FormattedMessage content={message.content} />
                ) : (
                  message.content
                )}
              </div>
                {message.role === 'user' && (
                  <div className="flex-shrink-0">
                    <Image
                      src="/images/muser.svg"
                      alt="User"
                      width={24}
                      height={30}
                      className="rounded-full w-6 h-8"
                    />
                  </div>
                )}
              </div>
            ))
          )}
          
          {isUploading && (
            <div className="flex justify-start items-center">
              <Image
                src="/images/loadmiscio.gif"  
                alt="Loading..."
                width={40}
                height={40}
                className="object-contain"
              />
              <span className="ml-2 text-gray-600 animate-pulse transition-opacity duration-1000">
                Uploading file to your assistant's knowledge!
              </span>
            </div>
          )}
          
          {uploadSuccess && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded text-center my-2">
              {uploadSuccess}
            </div>
          )}
          
          <div ref={messagesEndRef} />
          <DynamicLoadingIndicator 
            messages={loadingMessages}
            isVisible={showDynamicLoading && isLoading}
            onComplete={() => {
              console.log('Loading animation completed');
            }}
          />

          {/* Keep your existing loading for non-message operations (like file uploads) */}
          {isLoading && !showDynamicLoading && (
            <div className="flex justify-start items-center">
              <Image
                src="/images/loadmiscio.gif"  
                alt="Loading..."
                width={40}
                height={40}
                className="object-contain"
              />
            </div>
          )}

          <div ref={messagesEndRef} />
                  </div> 

        <div className="border-t border-gray-200 p-4">
          <form onSubmit={handleSendMessage} className="flex items-center space-x-4">
            {/* Add the hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              accept=".txt,.pdf,.doc,.docx,.csv,.xlsx" // Specify accepted file types
            />
            
            <button
              type="button"
              onClick={handleFileUpload}
              className={`p-2 ${isUploading ? 'text-blue-400 animate-pulse' : 'text-gray-400 hover:text-gray-600'} transition-colors`}
              disabled={isUploading}
            >
              <FileUp className="h-6 w-6" />
            </button>
            
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading || isUploading}
            />
            
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading || isUploading}
              className="w-8 h-8 flex items-center justify-center rounded-md text-white transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#049ad3' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#08bbff'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#049ad3'}
            >
              <ArrowUp className="h-5 w-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}