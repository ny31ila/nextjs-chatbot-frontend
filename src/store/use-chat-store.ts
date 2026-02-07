import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type BodyItemType = 'kv' | 'array' | 'object';

export interface KVItem {
  id: string;
  type: 'kv';
  key: string;
  value: string;
  isMessageSource: boolean; // Radio button selection
}

export interface ArrayItem {
  id: string;
  type: 'array';
  items: BodyNode[];
}

export interface ObjectItem {
  id: string;
  type: 'object';
  items: { key: string; value: BodyNode }[];
}

export type BodyNode = KVItem | ArrayItem | ObjectItem;

export interface ChatSession {
  id: string;
  name: string;
  url: string;
  protocol: 'http' | 'websocket';
  method: 'GET' | 'POST';
  headers: { id: string; key: string; value: string }[];
  cookies: { id: string; key: string; value: string }[];
  requestBody: BodyNode[]; // List of top-level items (usually an object but user can add multiple)
  responseBodyMapping: BodyNode[];
  isMarkdown: boolean;
  isPinned: boolean;
  history: Message[];
}

export interface Message {
  id: string;
  role: 'user' | 'bot';
  content: string;
  timestamp: number;
  rawRequest?: any;
  rawResponse?: any;
}

interface ChatStore {
  sessions: ChatSession[];
  activeSessionId: string | null;
  settings: {
    primaryColor: string;
    secondaryColor: string;
  };
  addSession: (session: ChatSession) => void;
  updateSession: (id: string, updates: Partial<ChatSession>) => void;
  deleteSession: (id: string) => void;
  setActiveSession: (id: string | null) => void;
  updateSettings: (updates: Partial<ChatStore['settings']>) => void;
  addMessage: (sessionId: string, message: Message) => void;
  clearHistory: (sessionId: string) => void;
}

export const createDefaultSession = (): ChatSession => ({
  id: crypto.randomUUID(),
  name: 'New Chat Session',
  url: '',
  protocol: 'http',
  method: 'POST',
  headers: [
    { id: '1', key: 'Authorization', value: '' },
    { id: '2', key: 'Accept', value: 'application/json' },
    { id: '3', key: 'Accept-Encoding', value: 'gzip, deflate, br' },
    { id: '4', key: 'Connection', value: 'keep-alive' },
  ],
  cookies: [],
  requestBody: [],
  responseBodyMapping: [],
  isMarkdown: true,
  isPinned: false,
  history: [],
});

export const useChatStore = create<ChatStore>()(
  persist(
    (set) => ({
      sessions: [],
      activeSessionId: null,
      settings: {
        primaryColor: '#ffffff',
        secondaryColor: '#000000',
      },
      addSession: (session) =>
        set((state) => ({ sessions: [...state.sessions, session] })),
      updateSession: (id, updates) =>
        set((state) => ({
          sessions: state.sessions.map((s) => (s.id === id ? { ...s, ...updates } : s)),
        })),
      deleteSession: (id) =>
        set((state) => ({
          sessions: state.sessions.filter((s) => s.id !== id),
          activeSessionId: state.activeSessionId === id ? null : state.activeSessionId,
        })),
      setActiveSession: (id) => set({ activeSessionId: id }),
      updateSettings: (updates) =>
        set((state) => ({ settings: { ...state.settings, ...updates } })),
      addMessage: (sessionId, message) =>
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId ? { ...s, history: [...s.history, message] } : s
          ),
        })),
      clearHistory: (sessionId) =>
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId ? { ...s, history: [] } : s
          ),
        })),
    }),
    {
      name: 'chatbot-postman-storage',
    }
  )
);
