import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ApiConfig } from '@/types';

interface ApiState {
  config: ApiConfig;
  isConfigured: boolean;
  setApiKey: (apiKey: string) => void;
  setModel: (model: string) => void;
  setMaxTokens: (maxTokens: number) => void;
  clearApiConfig: () => void;
}

const defaultConfig: ApiConfig = {
  apiKey: '',
  model: 'claude-3-7-sonnet-20250219',
  maxTokens: 4096,
};

export const useApiStore = create<ApiState>()(
  persist(
    (set) => ({
      config: defaultConfig,
      isConfigured: false,
      setApiKey: (apiKey: string) =>
        set((state) => ({
          config: { ...state.config, apiKey },
          isConfigured: apiKey.trim() !== '',
        })),
      setModel: (model: string) =>
        set((state) => ({
          config: { ...state.config, model },
        })),
      setMaxTokens: (maxTokens: number) =>
        set((state) => ({
          config: { ...state.config, maxTokens },
        })),
      clearApiConfig: () =>
        set({
          config: defaultConfig,
          isConfigured: false,
        }),
    }),
    {
      name: 'claude-api-storage',
    }
  )
);
