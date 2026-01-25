// Unified interface for AI model responses
export interface ModelResponse {
  model: string;
  provider: "openai" | "anthropic" | "xai";
  content: string;
  latency: number; // in milliseconds
  tokens: {
    prompt: number;
    completion: number;
    total: number;
  };
  cost: number; // in USD
  status: "success" | "error";
  error?: string;
}

// Store state
export interface PlaygroundState {
  prompt: string;
  isLoading: boolean;
  results: ModelResponse[];
  error: string | null;
  history: HistoryItem[];
  setPrompt: (prompt: string) => void;
  setLoading: (loading: boolean) => void;
  setResults: (results: ModelResponse[]) => void;
  setError: (error: string | null) => void;
  addToHistory: (item: HistoryItem) => void;
  clearResults: () => void;
  runComparison: () => Promise<void>;
}

// History item for saved comparisons
export interface HistoryItem {
  id: string;
  prompt: string;
  results: ModelResponse[];
  timestamp: string;
}
