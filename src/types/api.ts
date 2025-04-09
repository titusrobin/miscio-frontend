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
  messages?: Message[]; // Adding support for messages array response
}

// Define a separate type for thread message response to be more explicit
export interface ThreadMessageResponse {
  response?: string;
  messages?: Message[];
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

export interface User {
  id: string;
  username: string;
  email: string;
  is_active: boolean;
  created_at: string;
  assistant_id?: string;
  thread_id?: string;
}

export interface ProtectedResponse {
  message: string;
}