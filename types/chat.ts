export interface ChatResponse {
  id: string;
  model: string;
  provider: string;
  content: string;
  status: string;
  error?: string | null;
  promptTokens?: number;
  completionTokens?: number;
  cost?: number;
}

export interface Prompt {
  id: string;
  content: string;
  responses?: ChatResponse[];
}

export interface Chat {
  id: string;
  title?: string | null;
  userId?: string;
  createdAt?: Date;
  updatedAt?: Date;
  prompts: Prompt[];
}

export interface OptimisticPrompt {
  id: string;
  content: string;
}
