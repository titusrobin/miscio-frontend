// src/app/services/api.ts
import { Message, LoginResponse, ChatResponse, Thread, User, ProtectedResponse, ThreadMessageResponse, FileUploadResponse } from '@/types/api';
import env from '@/config/env';

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL || ''}/api/v1`;

export interface ApiResponse<T> {
  data: T;
  error?: string;
}

class ApiService {
  private getHeaders(contentType: string = 'application/json'): HeadersInit {
    let token = '';
    if (typeof window !== 'undefined') {
      token = localStorage.getItem('token') || '';
    }

    const headers: Record<string, string> = {
      'Content-Type': contentType,
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  private async request<T>(endpoint: string, options: RequestInit, timeoutMs: number = 300000): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log(`[${env.ENVIRONMENT}] Requesting: ${url}`);
    const headers = this.getHeaders((options.headers as Record<string, string>)?.['Content-Type']);
    // Simple timeout wrapper
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
    );
    
    try {
      const response = await Promise.race([
        fetch(url, {
          ...options,
          headers,
        }),
        timeoutPromise
      ]) as Response;
      
      if (!response.ok) {
        if (response.status === 401) {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
            window.location.href = '/';
          }
          throw new Error('Session expired');
        }
        const error = await response.json();
        throw new Error(error.detail || 'An error occurred');
      }
      return response.json();
    } catch (error) {
      console.error(`[${env.ENVIRONMENT}] API Error:`, error);
      throw error;
    }
  }

  async login(username: string, password: string): Promise<LoginResponse> {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    return this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });
  }


  async register(username: string, password: string): Promise<LoginResponse> {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    return this.request<LoginResponse>('/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });
  }

  async getCurrentUser(): Promise<User> {
    return this.request<User>('/auth/me', {
      method: 'GET',
    });
  }

  async getProtectedEndpoint(): Promise<ProtectedResponse> {
    return this.request<ProtectedResponse>('/auth/protected-endpoint', {
      method: 'GET',
    });
  }

  async sendMessage(content: string): Promise<ChatResponse> {
    return this.request<ChatResponse>('/chat/message', {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  async getChatHistory(thread_id: string): Promise<Message[]> {
    return this.request<Message[]>(`/chat/history/${thread_id}`, {
      method: 'GET',
    }); 
  }

  async createThread(): Promise<Thread> {
    return this.request<Thread>('/chat/threads', {
      method: 'POST'
    });
  }

  async getThreads(): Promise<Thread[]> {
    return this.request<Thread[]>('/chat/threads', {
      method: 'GET'
    });
  }

  async getThreadMessages(threadId: string): Promise<Message[]> {
    return this.request<Message[]>(`/chat/threads/${threadId}/messages`, {
      method: 'GET'
    });
  }

  // NEW METHOD: Generate loading messages for a prompt
  async generateLoadingMessages(content: string): Promise<string[]> {
    try {
      const response = await this.request<{loading_messages: string[]}>('/chat/loading-messages', {
        method: 'POST',
        body: JSON.stringify({ content }),
      });
      return response.loading_messages || [];
    } catch (error) {
      console.error('Error generating loading messages:', error);
      // Return fallback messages if API fails
      return [
        "Processing your request...",
        "Analyzing the requirements...",
        "Setting up the necessary parameters...",
        "Preparing the response...",
        "Gathering relevant information...",
        "Finalizing the details...",
        "Almost ready...",
        "Completing final steps...",
        "Just a moment more..."
      ];
    }
  }

  // UPDATED METHOD: Enhanced sendThreadMessage with loading support
  async sendThreadMessage(threadId: string, content: string): Promise<ThreadMessageResponse> {
    // Detect if this might be a campaign request for longer timeout
    const isCampaignRequest = content.toLowerCase().includes('campaign') || 
                             content.toLowerCase().includes('send message') ||
                             content.toLowerCase().includes('reach out');
    
    // Use longer timeout for campaign requests
    const timeoutMs = isCampaignRequest ? 600000 : 300000; // 10 minutes for campaigns, 5 minutes for regular
    
    // Try the request up to 3 times
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        return await this.request<ThreadMessageResponse>(`/chat/threads/${threadId}/messages`, {
          method: 'POST',
          body: JSON.stringify({ content })
        }, timeoutMs);
      } catch (error) {
        console.log(`Attempt ${attempt} failed:`, error);
        
        if (attempt === 3) {
          throw error;
        }
        
        // Wait 2 seconds before retrying
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    throw new Error('All retry attempts failed');
  }
  
  private async requestWithFormData<T>(endpoint: string, formData: FormData, timeoutMs: number = 300000): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log(`[${env.ENVIRONMENT}] Requesting: ${url} with FormData`);
    
    // Get token for authorization
    let token = '';
    if (typeof window !== 'undefined') {
      token = localStorage.getItem('token') || '';
    }
    
    // Only set the Authorization header
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      
    }

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
    );
    
    try {
      const response = await Promise.race([
        fetch(url, {
          method: 'POST',
          headers,
          body: formData,
        }),
        timeoutPromise
      ]) as Response;
      
      if (!response.ok) {
        if (response.status === 401) {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
            window.location.href = '/';
          }
          throw new Error('Session expired');
        }
        const error = await response.json();
        throw new Error(error.detail || 'An error occurred');
      }
      return response.json();
    } catch (error) {
      console.error(`[${env.ENVIRONMENT}] API Error:`, error);
      throw error;
    }
  }
  
  // Then, update your uploadFile method to use it
  async uploadFile(file: File, vectorStoreName?: string): Promise<FileUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    if (vectorStoreName) {
      formData.append('vector_store_name', vectorStoreName);
    }
    
    return this.requestWithFormData<FileUploadResponse>('/rag/upload', formData);
  }

  async updateThreadTitle(threadId: string, title: string): Promise<Thread> {
    return this.request<Thread>(`/chat/threads/${threadId}/title`, {
      method: 'PUT',
      body: JSON.stringify({ title })
    });
  }

  async generateThreadTitle(messages: Message[]): Promise<string> {
    // Get up to the first 5 exchanges (10 messages) to generate a title
    const conversationContext = messages.slice(0, 10).map(m => 
      `${m.role}: ${m.content.substring(0, 100)}`
    ).join('\n');
    
    const prompt = `Based on this conversation, generate a concise, descriptive title (max 5 words):\n\n${conversationContext}\n\nTitle:`;
    
    const response = await this.sendMessage(prompt);
    // Extract just the title from the response
    return response.response.trim();
  }
}

export const api = new ApiService();