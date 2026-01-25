"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ModelResponse, HistoryItem } from "@/types/store";

interface StreamingState {
  openai: { content: string; isLoading: boolean; error: string | null };
  anthropic: { content: string; isLoading: boolean; error: string | null };
  xai: { content: string; isLoading: boolean; error: string | null };
}

interface PlaygroundState {
  prompt: string;
  isLoading: boolean;
  results: ModelResponse[];
  streaming: StreamingState;
  error: string | null;
  history: HistoryItem[];
  setPrompt: (prompt: string) => void;
  setLoading: (loading: boolean) => void;
  setResults: (results: ModelResponse[]) => void;
  setError: (error: string | null) => void;
  addToHistory: (item: HistoryItem) => void;
  clearResults: () => void;
  updateStreamingContent: (
    provider: keyof StreamingState,
    content: string,
  ) => void;
  setStreamingLoading: (
    provider: keyof StreamingState,
    isLoading: boolean,
  ) => void;
  setStreamingError: (
    provider: keyof StreamingState,
    error: string | null,
  ) => void;
  resetStreaming: () => void;
  runComparison: () => Promise<void>;
}

const initialStreamingState: StreamingState = {
  openai: { content: "", isLoading: false, error: null },
  anthropic: { content: "", isLoading: false, error: null },
  xai: { content: "", isLoading: false, error: null },
};

export const usePlaygroundStore = create<PlaygroundState>()(
  persist(
    (set, get) => ({
      prompt: "",
      isLoading: false,
      results: [],
      streaming: initialStreamingState,
      error: null,
      history: [],

      setPrompt: (prompt: string) => set({ prompt }),
      setLoading: (isLoading: boolean) => set({ isLoading }),
      setResults: (results: ModelResponse[]) => set({ results }),
      setError: (error: string | null) => set({ error }),

      addToHistory: (item: HistoryItem) =>
        set((state) => ({
          history: [item, ...state.history].slice(0, 50),
        })),

      clearResults: () => set({ results: [], error: null }),

      updateStreamingContent: (provider, content) =>
        set((state) => ({
          streaming: {
            ...state.streaming,
            [provider]: { ...state.streaming[provider], content },
          },
        })),

      setStreamingLoading: (provider, isLoading) =>
        set((state) => ({
          streaming: {
            ...state.streaming,
            [provider]: { ...state.streaming[provider], isLoading },
          },
        })),

      setStreamingError: (provider, error) =>
        set((state) => ({
          streaming: {
            ...state.streaming,
            [provider]: {
              ...state.streaming[provider],
              error,
              isLoading: false,
            },
          },
        })),

      resetStreaming: () => set({ streaming: initialStreamingState }),

      runComparison: async () => {
        const {
          prompt,
          setLoading,
          setResults,
          setError,
          addToHistory,
          resetStreaming,
          updateStreamingContent,
          setStreamingLoading,
          setStreamingError,
        } = get();

        if (!prompt.trim()) {
          setError("Please enter a prompt");
          return;
        }

        setLoading(true);
        setError(null);
        setResults([]);
        resetStreaming();

        const providers = ["openai", "anthropic", "xai"] as const;
        const startTimes: Record<string, number> = {};
        const modelResults: ModelResponse[] = [];

        // Start all streams in parallel
        const streamPromises = providers.map(async (provider) => {
          startTimes[provider] = Date.now();
          setStreamingLoading(provider, true);

          try {
            const response = await fetch(`/api/stream/${provider}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ prompt }),
            });

            if (!response.ok) {
              throw new Error(`HTTP ${response.status}`);
            }

            if (!response.body) {
              throw new Error("No response stream");
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullContent = "";

            if (reader) {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                // toTextStreamResponse sends raw text chunks
                const chunk = decoder.decode(value, { stream: true });
                fullContent += chunk;
                updateStreamingContent(provider, fullContent);
              }
            }

            const latency = Date.now() - startTimes[provider];
            const modelNames = {
              openai: "GPT-4o",
              anthropic: "Claude 3.5 Sonnet",
              xai: "Grok 3",
            };

            return {
              model: modelNames[provider],
              provider,
              content: fullContent,
              latency,
              tokens: { prompt: 0, completion: 0, total: 0 }, // Updated via metadata
              cost: 0,
              status: "success" as const,
            };
          } catch (error) {
            const latency = Date.now() - startTimes[provider];
            const modelNames = {
              openai: "GPT-4o",
              anthropic: "Claude 3.5 Sonnet",
              xai: "Grok 3",
            };

            setStreamingError(
              provider,
              error instanceof Error ? error.message : "Stream failed",
            );

            return {
              model: modelNames[provider],
              provider,
              content: "",
              latency,
              tokens: { prompt: 0, completion: 0, total: 0 },
              cost: 0,
              status: "error" as const,
              error: error instanceof Error ? error.message : "Stream failed",
            };
          } finally {
            setStreamingLoading(provider, false);
          }
        });

        // Wait for all streams to complete
        const results = await Promise.all(streamPromises);
        setResults(results);

        // Add to history
        addToHistory({
          id: Date.now().toString(),
          prompt,
          results,
          timestamp: new Date().toISOString(),
        });

        setLoading(false);
      },
    }),
    {
      name: "ai-playground-storage",
      partialize: (state) => ({ history: state.history }),
    },
  ),
);
