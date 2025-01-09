'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Send, Plus, FileUp } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { api } from '@/app/services/api';
import { Message, Thread } from '@/types/api';

export default function DashboardPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThread, setActiveThread] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    loadThreads();
  }, []);

  useEffect(() => {
    if (activeThread) {
      loadThreadMessages(activeThread);
    }
  }, [activeThread]);

  const loadThreads = async () => {
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
  };

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
    setInputMessage('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.sendThreadMessage(activeThread, inputMessage);
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: response.response,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMessage]);
      await loadThreads(); // Refresh threads to update last message
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
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

  const handleFileUpload = () => {
    console.log('File upload clicked');
  };

  // Rest of your JSX remains the same, just update the thread object properties:
  // thread.lastMessage -> thread.last_message
  // thread.timestamp -> thread.last_activity
  
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
                      src="/images/miscio_agent.jpg"
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
                  {message.content}
                </div>
                {message.role === 'user' && (
                  <div className="flex-shrink-0">
                    <Image
                      src="/images/user-128.png"
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
            <button
              type="button"
              onClick={handleFileUpload}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <FileUp className="h-5 w-5" />
            </button>
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
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