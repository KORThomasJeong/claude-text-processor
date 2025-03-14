import axios from 'axios';
import { ApiConfig, ClaudeModel } from '@/types';

export class ClaudeService {
  private config: ApiConfig;

  constructor(config: ApiConfig) {
    this.config = config;
  }

  async getModels(): Promise<ClaudeModel[]> {
    try {
      // 내부 API 라우트를 통해 호출
      const response = await axios.get(
        `/api/claude/models?apiKey=${encodeURIComponent(this.config.apiKey || '')}`
      );

      if (!response.data.data || !Array.isArray(response.data.data)) {
        throw new Error('모델 목록을 가져오는데 실패했습니다.');
      }

      interface ApiModel {
        id: string;
        display_name?: string;
        created_at?: string;
      }
      
      return response.data.data.map((model: ApiModel) => ({
        id: model.id,
        name: model.display_name || model.id,
        createdAt: model.created_at || '',
      }));
    } catch (error) {
      console.error('Claude API 모델 목록 호출 중 오류가 발생했습니다:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.response) {
          console.error('API 응답 데이터:', error.response.data);
          throw new Error(
            `API 오류 (${error.response.status}): ${
              error.response.data.error?.message || JSON.stringify(error.response.data) || '알 수 없는 오류'
            }`
          );
        } else if (error.request) {
          console.error('요청 정보:', error.request);
          throw new Error('API 서버에서 응답이 없습니다. 네트워크 연결을 확인하세요.');
        }
      }
      
      console.error('오류 상세 정보:', error);
      throw new Error('API 호출 중 오류가 발생했습니다: ' + (error instanceof Error ? error.message : String(error)));
    }
  }

  async processText(input: string, prompt: string): Promise<string> {
    try {
      // 내부 API 라우트를 통해 호출
      const response = await axios.post('/api/claude/process', {
        model: this.config.model || 'claude-3-7-sonnet-20250219',
        maxTokens: this.config.maxTokens || 4096,
        input,
        prompt
      });

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      let result = response.data.content[0].text;
      
      // 코드 블록 추출 (```로 시작하고 ```로 끝나는 부분)
      const codeBlockRegex = /```(?:[\w]*\n)?([\s\S]*?)```/g;
      const codeBlocks = [...result.matchAll(codeBlockRegex)].map(match => match[1].trim());
      
      // 코드 블록이 있으면 코드 블록만 반환
      if (codeBlocks.length > 0) {
        result = codeBlocks.join('\n\n');
      }
      
      // 응답이 짤렸는지 확인 (응답 길이가 최대 토큰 수의 90% 이상인 경우)
      const maxTokens = this.config.maxTokens || 4096;
      const estimatedTokens = result.length / 4; // 대략적인 토큰 수 추정 (4자당 1토큰)
      
      if (estimatedTokens > maxTokens * 0.9) {
        // 응답이 짤렸을 가능성이 있음
        try {
          // 이어서 요청
          const continuationResponse = await axios.post('/api/claude/process', {
            model: this.config.model || 'claude-3-7-sonnet-20250219',
            maxTokens: this.config.maxTokens || 4096,
            input,
            prompt: `${prompt}\n\n이전 응답에 이어서 계속해주세요. 이전 응답:\n${result}`
          });
          
          if (!continuationResponse.data.error) {
            // 이전 응답과 새 응답 합치기
            result += "\n\n[계속...]\n\n" + continuationResponse.data.content[0].text;
          }
        } catch (continuationError) {
          console.error("이어서 요청하는 중 오류가 발생했습니다:", continuationError);
          // 원래 응답만 반환
        }
      }
      
      return result;
    } catch (error) {
      console.error('Claude API 호출 중 오류가 발생했습니다:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.response) {
          // 서버 응답이 있는 경우
          console.error('API 응답 데이터:', error.response.data);
          throw new Error(
            `API 오류 (${error.response.status}): ${
              error.response.data.error?.message || JSON.stringify(error.response.data) || '알 수 없는 오류'
            }`
          );
        } else if (error.request) {
          // 요청은 보냈지만 응답이 없는 경우
          console.error('요청 정보:', error.request);
          throw new Error('API 서버에서 응답이 없습니다. 네트워크 연결을 확인하세요.');
        }
      }
      
      console.error('오류 상세 정보:', error);
      throw new Error('API 호출 중 오류가 발생했습니다: ' + (error instanceof Error ? error.message : String(error)));
    }
  }
}
