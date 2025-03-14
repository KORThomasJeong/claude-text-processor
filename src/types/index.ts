export interface Prompt {
  id: string;
  name: string;
  description: string;
  template: string;
  category: string;
  outputFormat: 'html' | 'text';
  isFavorite: boolean;
}

export interface ClaudeModel {
  id: string;
  name: string;
  createdAt: string;
}

export interface ApiConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
}

export interface ProcessResult {
  id: string;
  timestamp: string;
  input: string;
  output: string;
  promptId: string;
  format: 'html' | 'text';
}
