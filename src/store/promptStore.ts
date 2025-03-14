import { create } from 'zustand';
import { Prompt } from '@/types';

interface PromptState {
  prompts: Prompt[];
  selectedPromptId: string | null;
  isLoading: boolean;
  error: string | null;
  fetchPrompts: () => Promise<void>;
  addPrompt: (prompt: Omit<Prompt, 'id'>) => Promise<void>;
  updatePrompt: (id: string, updates: Partial<Prompt>) => Promise<void>;
  deletePrompt: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  selectPrompt: (id: string | null) => void;
}

export const usePromptStore = create<PromptState>()((set, get) => ({
  prompts: [],
  selectedPromptId: null,
  isLoading: false,
  error: null,

  // 프롬프트 목록 가져오기
  fetchPrompts: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/prompts');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '프롬프트 목록을 가져오는데 실패했습니다.');
      }
      
      const prompts = await response.json();
      set({ prompts, isLoading: false });
      
      // 선택된 프롬프트가 없고 프롬프트가 있으면 첫 번째 프롬프트 선택
      if (!get().selectedPromptId && prompts.length > 0) {
        set({ selectedPromptId: prompts[0].id });
      }
    } catch (error) {
      console.error('프롬프트 목록을 가져오는 중 오류가 발생했습니다:', error);
      set({ 
        error: error instanceof Error ? error.message : '프롬프트 목록을 가져오는 중 오류가 발생했습니다.',
        isLoading: false 
      });
    }
  },

  // 프롬프트 추가
  addPrompt: async (promptData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/prompts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(promptData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '프롬프트 추가에 실패했습니다.');
      }
      
      const data = await response.json();
      
      // 프롬프트 목록 다시 가져오기
      await get().fetchPrompts();
      
      // 새로 추가된 프롬프트 선택
      set({ selectedPromptId: data.prompt.id });
    } catch (error) {
      console.error('프롬프트 추가 중 오류가 발생했습니다:', error);
      set({ 
        error: error instanceof Error ? error.message : '프롬프트 추가 중 오류가 발생했습니다.',
        isLoading: false 
      });
    }
  },

  // 프롬프트 업데이트
  updatePrompt: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/prompts/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '프롬프트 업데이트에 실패했습니다.');
      }
      
      // 프롬프트 목록 다시 가져오기
      await get().fetchPrompts();
    } catch (error) {
      console.error('프롬프트 업데이트 중 오류가 발생했습니다:', error);
      set({ 
        error: error instanceof Error ? error.message : '프롬프트 업데이트 중 오류가 발생했습니다.',
        isLoading: false 
      });
    }
  },

  // 프롬프트 삭제
  deletePrompt: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/prompts/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '프롬프트 삭제에 실패했습니다.');
      }
      
      // 선택된 프롬프트가 삭제된 경우 선택 해제
      if (get().selectedPromptId === id) {
        set({ selectedPromptId: null });
      }
      
      // 프롬프트 목록 다시 가져오기
      await get().fetchPrompts();
    } catch (error) {
      console.error('프롬프트 삭제 중 오류가 발생했습니다:', error);
      set({ 
        error: error instanceof Error ? error.message : '프롬프트 삭제 중 오류가 발생했습니다.',
        isLoading: false 
      });
    }
  },

  // 즐겨찾기 토글
  toggleFavorite: async (id) => {
    set({ isLoading: true, error: null });
    try {
      // 현재 프롬프트 찾기
      const prompt = get().prompts.find(p => p.id === id);
      if (!prompt) {
        throw new Error('프롬프트를 찾을 수 없습니다.');
      }
      
      // 즐겨찾기 상태 토글
      const response = await fetch(`/api/prompts/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isFavorite: !prompt.isFavorite }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '즐겨찾기 토글에 실패했습니다.');
      }
      
      // 프롬프트 목록 다시 가져오기
      await get().fetchPrompts();
    } catch (error) {
      console.error('즐겨찾기 토글 중 오류가 발생했습니다:', error);
      set({ 
        error: error instanceof Error ? error.message : '즐겨찾기 토글 중 오류가 발생했습니다.',
        isLoading: false 
      });
    }
  },

  // 프롬프트 선택
  selectPrompt: (id) => {
    set({ selectedPromptId: id });
  },
}));
