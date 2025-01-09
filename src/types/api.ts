// src/types/api.ts
export interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    created_at?: string;
  }
  
  export interface LoginResponse {
    access_token: string;
    token_type: string;
    assistant_id: string;
    thread_id: string;
  }
  
  export interface ChatResponse {
    response: string;
  }

export interface Thread {
    id: string;
    title: string;
    created_at: string;
    last_message?: string;
    last_activity: string;
  }
  
  export interface ChatHistory {
    thread_id: string;
    messages: Message[];
    assistant_id: string;
  }