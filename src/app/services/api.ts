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

  private async request<T>(endpoint: string, options: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log(`[${env.ENVIRONMENT}] Requesting: ${url}`);
    const headers = this.getHeaders((options.headers as Record<string, string>)?.['Content-Type']);
    
    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });
      
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

  // Updated to use the explicit ThreadMessageResponse type
  async sendThreadMessage(threadId: string, content: string): Promise<ThreadMessageResponse> {
    return this.request<ThreadMessageResponse>(`/chat/threads/${threadId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content })
    });
  }
  
  async uploadFile(file: File, vectorStoreName?: string): Promise<FileUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    if (vectorStoreName) {
      formData.append('vector_store_name', vectorStoreName);
    }
  
    return this.request<FileUploadResponse>('/rag/upload', {
      method: 'POST',
      headers: {
      },
      body: formData,
    });
  }
}

export const api = new ApiService();