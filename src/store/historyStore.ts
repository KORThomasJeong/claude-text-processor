import { create } from 'zustand';
import { toast } from 'sonner';

export interface ProcessResult {
  id: string;
  timestamp?: string;
  createdAt?: string;
  input: string;
  output: string;
  promptId: string;
  format: 'html' | 'text';
  isProcessing?: boolean;
  userId?: string;
  prompt?: {
    name: string;
    category: string;
    outputFormat: string;
  };
  user?: {
    id: string;
    email: string;
    name: string | null;
  };
}

interface HistoryState {
  results: ProcessResult[];
  isLoading: boolean;
  error: string | null;
  fetchResults: (page?: number, limit?: number) => Promise<void>;
  addResult: (result: Omit<ProcessResult, 'id' | 'timestamp'>) => Promise<void>;
  updateProcessingStatus: (id: string, isProcessing: boolean) => void;
  addProcessingResult: (input: string, promptId: string, format: 'html' | 'text') => string;
  deleteResult: (id: string) => Promise<void>;
  clearHistory: () => Promise<void>;
}

export const useHistoryStore = create<HistoryState>()((set, get) => ({
  results: [],
  isLoading: false,
  error: null,

  // 처리 기록 가져오기
  fetchResults: async (page = 1, limit = 50) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/results?page=${page}&limit=${limit}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '처리 기록을 가져오는데 실패했습니다.');
      }
      
      const data = await response.json();
      
      // 처리 중인 결과는 유지하고 나머지는 서버에서 가져온 결과로 대체
      const processingResults = get().results.filter(r => r.isProcessing);
      set({ 
        results: [...processingResults, ...data.results],
        isLoading: false 
      });
    } catch (error) {
      console.error('처리 기록을 가져오는 중 오류가 발생했습니다:', error);
      set({ 
        error: error instanceof Error ? error.message : '처리 기록을 가져오는 중 오류가 발생했습니다.',
        isLoading: false 
      });
    }
  },

  // 결과 추가 (데이터베이스에 저장)
  addResult: async (resultData) => {
    try {
      // 데이터베이스에 결과 저장
      const response = await fetch('/api/results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(resultData),
        credentials: 'include', // 쿠키 포함
      });
      
      if (!response.ok) {
        console.error('처리 결과 저장 실패:', await response.text());
        toast.error('처리 결과를 저장하는데 실패했습니다.');
        return;
      }
      
      // 처리 기록 다시 가져오기
      await get().fetchResults();
    } catch (error) {
      console.error('처리 결과 저장 중 오류가 발생했습니다:', error);
      toast.error('처리 결과를 저장하는데 실패했습니다.');
    }
  },

  // 처리 중인 결과 상태 업데이트 (로컬 상태만 변경)
  updateProcessingStatus: (id, isProcessing) => 
    set((state) => ({
      results: state.results.map(result => 
        result.id === id ? { ...result, isProcessing } : result
      ),
    })),

  // 처리 중인 결과 추가 (로컬 상태만 변경)
  addProcessingResult: (input, promptId, format) => {
    const id = `processing-${Date.now()}`;
    const newResult = {
      id,
      input,
      output: '',
      promptId,
      format,
      timestamp: new Date().toISOString(),
      isProcessing: true,
    };
    set((state) => ({
      results: [newResult, ...state.results],
    }));
    return id;
  },

  // 결과 삭제
  deleteResult: async (id) => {
    set({ isLoading: true, error: null });
    try {
      // 처리 중인 결과인 경우 로컬에서만 삭제
      if (id.startsWith('processing-')) {
        set((state) => ({
          results: state.results.filter((result) => result.id !== id),
          isLoading: false,
        }));
        return;
      }
      
      // 데이터베이스에서 결과 삭제
      const response = await fetch(`/api/results/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '처리 결과 삭제에 실패했습니다.');
      }
      
      // 처리 기록 다시 가져오기
      await get().fetchResults();
    } catch (error) {
      console.error('처리 결과 삭제 중 오류가 발생했습니다:', error);
      set({ 
        error: error instanceof Error ? error.message : '처리 결과 삭제 중 오류가 발생했습니다.',
        isLoading: false 
      });
    }
  },

  // 모든 결과 삭제
  clearHistory: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/results/clear', {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '처리 기록 삭제에 실패했습니다.');
      }
      
      set({ results: [], isLoading: false });
    } catch (error) {
      console.error('처리 기록 삭제 중 오류가 발생했습니다:', error);
      set({ 
        error: error instanceof Error ? error.message : '처리 기록 삭제 중 오류가 발생했습니다.',
        isLoading: false 
      });
    }
  },
}));
