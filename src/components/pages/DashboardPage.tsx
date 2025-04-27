// src/components/pages/DashboardPage.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Send, Plus, FileUp } from 'lucide-react';
import Image from 'next/image';
import { api } from '@/app/services/api';
import { Message, Thread } from '@/types/api';
import { FormattedMessage } from '@/components/FormattedMessage';


export default function DashboardPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThread, setActiveThread] = useState<string | null>(null);
  
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
      }
    } catch (error) {
      console.error('Error loading threads:', error);
      setError('Failed to load threads');
    }
  }, [activeThread]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

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

    // Add user message to state immediately
    setMessages(prev => [...prev, newMessage]);
    setInputMessage('');
    setIsLoading(true);
    setError(null);

    try {
      // Make API call to send message
      const response = await api.sendThreadMessage(activeThread, inputMessage);
      
      // Check if response contains messages array (modified API response)
      if (response.messages && Array.isArray(response.messages)) {
        const serverMessages = response.messages as Message[];
        // If API returns both user and assistant messages, update state with entire array
        // This replaces the temporary user message with the server version and adds the assistant's response
        setMessages(prev => [
          ...prev.slice(0, prev.length - 1), // Remove the temporary user message
          ...serverMessages // Add both messages from the server
        ]);
      } else if (response.response) {
        // If API returns just the assistant's response
        const assistantMessage: Message = {
          role: 'assistant',
          content: response.response,
          timestamp: new Date().toISOString()
        };

        // Add assistant message to state
        setMessages(prev => [...prev, assistantMessage]);
      }
      
      // Refresh threads to update last message
      await loadThreads();
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
      // Remove the temporary user message if the request fails
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
      // Ensure scroll to bottom after state updates
      setTimeout(scrollToBottom, 100);
    }
  };

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
      setUploadSuccess(`File ${file.name} uploaded successfully!`);

      setTimeout(() => {
        setUploadSuccess(null);
      }, 2500); // 5000ms = 5 seconds
      
      // Add a system message about the successful upload
      const systemMessage: Message = {
        role: 'assistant',
        content: `File ${file.name} has been uploaded successfully. You can now ask questions about its content.`,
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
                {new Date(thread.last_activity).toLocaleString()}
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
                      width={32}
                      height={32}
                      className="rounded-full w-8 h-8"
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
                      width={32}
                      height={32}
                      className="rounded-full w-8 h-8"
                    />
                  </div>
                )}
              </div>
            ))
          )}
          
          {isUploading && (
            <div className="flex justify-center items-center my-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-2">Uploading file...</span>
            </div>
          )}
          
          {uploadSuccess && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded text-center my-2">
              {uploadSuccess}
            </div>
          )}
          
          <div ref={messagesEndRef} />
          {isLoading && (
            <div className="flex justify-start items-center space-x-2">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          )}
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
              <FileUp className="h-5 w-5" />
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
              className="p-2 text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              <Send className="h-5 w-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}