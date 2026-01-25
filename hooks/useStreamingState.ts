import { useState, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { OptimisticPrompt, Prompt } from "@/types/chat";

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

    if (completedStreamsRef.current.get(promptId)!.size === 3) {
      queryClient
        .fetchQuery({
          queryKey: ["get-chat", chatId],
          queryFn: async () => {
            const { getChatById } = await import("@/actions/chat");
            const result = await getChatById(chatId);
            if (result.error) {
              return null;
            }
            return result.chat;
          },
        })
        .then((updatedChat) => {
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
        })
        .catch((error) => {
          console.error("Error fetching chat after stream complete:", error);
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
