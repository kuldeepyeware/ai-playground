import { useState, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { OptimisticPrompt, Chat, Prompt } from "@/types/chat";

export function useStreamingState(chatId: string) {
  const queryClient = useQueryClient();
  const [streamingPromptIds, setStreamingPromptIds] = useState<Set<string>>(
    new Set(),
  );
  const [optimisticPrompt, setOptimisticPrompt] =
    useState<OptimisticPrompt | null>(null);
  const completedStreamsRef = useRef<Map<string, Set<string>>>(new Map());
  const streamingStartedRef = useRef<Set<string>>(new Set());

  // Reset tracking when chat ID changes
  useEffect(() => {
    streamingStartedRef.current = new Set();
    completedStreamsRef.current = new Map();

    return () => {
      streamingStartedRef.current = new Set();
      completedStreamsRef.current = new Map();
    };
  }, [chatId]);

  const isStreaming = streamingPromptIds.size > 0;

  const handlePromptSubmit = (promptId: string, promptContent: string) => {
    // Show optimistic prompt immediately
    setOptimisticPrompt({ id: promptId, content: promptContent });

    // Mark as streaming
    streamingStartedRef.current.add(promptId);
    setStreamingPromptIds((prev) => new Set(prev).add(promptId));

    // Initialize completion tracking for this prompt
    completedStreamsRef.current.set(promptId, new Set());
  };

  const handleStreamComplete = (promptId: string, provider: string) => {
    if (!completedStreamsRef.current.has(promptId)) {
      completedStreamsRef.current.set(promptId, new Set());
    }

    completedStreamsRef.current.get(promptId)!.add(provider);

    // Check if all 3 providers completed for this prompt
    // Inside handleStreamComplete in useStreamingState.ts
    if (completedStreamsRef.current.get(promptId)!.size === 3) {
      // 1. Trigger the refetch
      queryClient
        .refetchQueries({ queryKey: ["get-chat", chatId] })
        .then(() => {
          // 2. ONLY clear streaming state once we are sure the DB data is in the cache
          const updatedChat = queryClient.getQueryData<Chat | null>([
            "get-chat",
            chatId,
          ]);
          const foundPrompt =
            updatedChat?.prompts?.find((p: Prompt) => p.id === promptId) ??
            null;
          const hasResponses = (foundPrompt?.responses?.length ?? 0) > 0;

          if (hasResponses) {
            setStreamingPromptIds((prev) => {
              const newSet = new Set(prev);
              newSet.delete(promptId);
              return newSet;
            });
            setOptimisticPrompt(null);
          }
        });
    }
  };

  const startStreamingForPrompts = (promptIds: string[]) => {
    promptIds.forEach((promptId) => {
      streamingStartedRef.current.add(promptId);
      if (!completedStreamsRef.current.has(promptId)) {
        completedStreamsRef.current.set(promptId, new Set());
      }
    });

    setStreamingPromptIds((prev) => {
      const newSet = new Set(prev);
      promptIds.forEach((id) => newSet.add(id));
      return newSet;
    });
  };

  const clearOptimisticPromptIfMatches = (promptContent: string) => {
    if (optimisticPrompt?.content === promptContent) {
      setOptimisticPrompt(null);
    }
  };

  return {
    streamingPromptIds,
    optimisticPrompt,
    isStreaming,
    streamingStartedRef,
    handlePromptSubmit,
    handleStreamComplete,
    startStreamingForPrompts,
    clearOptimisticPromptIfMatches,
  };
}
